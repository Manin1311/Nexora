"""
AI Code Review Bot module.
Provides review_github_repo() — the main entry point.
"""
import re
import json
import base64
import concurrent.futures as _cf

import requests
from django.conf import settings

from core.gemini_client import _call_groq  # reuse the existing Groq caller


# ── File filtering ────────────────────────────────────────────────────────────

_REVIEWABLE_EXTENSIONS = {
    '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.go',
    '.rb', '.php', '.cs', '.cpp', '.c', '.swift', '.kt',
    '.rs', '.vue', '.html', '.css', '.sql',
}

_SKIP_PATTERNS = {
    'node_modules', '.git', 'dist', 'build', '__pycache__',
    'migrations', '.venv', 'venv', 'vendor', '.next',
}


def _should_review(path: str, extensions=None) -> bool:
    if extensions is None:
        extensions = _REVIEWABLE_EXTENSIONS
    lower = path.lower()
    for skip in _SKIP_PATTERNS:
        if skip in lower:
            return False
    if '.min.js' in lower or '.min.css' in lower or '.map' in lower:
        return False
    if 'package-lock' in lower or 'yarn.lock' in lower or 'poetry.lock' in lower:
        return False
    ext = ('.' + lower.rsplit('.', 1)[-1]) if '.' in lower else ''
    return ext in extensions


# ── GitHub helpers ────────────────────────────────────────────────────────────

def _gh_headers(token: str) -> dict:
    h = {'Accept': 'application/vnd.github+json'}
    if token:
        h['Authorization'] = f'Bearer {token}'
    return h


# ── GitHub Token Pool (round-robin rotation) ──────────────────────────────────

import threading as _threading

class _GithubTokenPool:
    """
    Round-robin pool of GitHub personal access tokens.
    Rotates on each call and falls back to the next token on 403/429 rate-limit errors.
    """
    def __init__(self):
        self._lock = _threading.Lock()
        self._index = 0
        self._tokens = []

    def _load(self):
        """Load tokens from settings (lazy, so Django is ready)."""
        if not self._tokens:
            self._tokens = list(getattr(settings, 'GITHUB_TOKENS', []))
            if not self._tokens:
                single = getattr(settings, 'GITHUB_TOKEN', '')
                if single:
                    self._tokens = [single]

    def get(self) -> str:
        """Return the current token (empty string if none configured)."""
        with self._lock:
            self._load()
            if not self._tokens:
                return ''
            token = self._tokens[self._index % len(self._tokens)]
            self._index = (self._index + 1) % len(self._tokens)
            return token

    def rotate(self) -> str:
        """Advance to next token immediately (called on rate-limit hit)."""
        with self._lock:
            self._load()
            if not self._tokens:
                return ''
            self._index = (self._index + 1) % len(self._tokens)
            return self._tokens[self._index % len(self._tokens)]

    def __len__(self):
        self._load()
        return len(self._tokens)

_gh_token_pool = _GithubTokenPool()



def _get_repo_file_tree(owner: str, repo: str, token: str = '') -> list:
    """Return list of blob file paths from the repo's default branch."""
    if not token:
        token = _gh_token_pool.get()
    
    attempts = max(1, len(_gh_token_pool))
    branch = 'main'

    for attempt in range(attempts):
        h = _gh_headers(token)
        try:
            r = requests.get(
                f'https://api.github.com/repos/{owner}/{repo}',
                headers=h, timeout=10,
            )
            if r.status_code == 401:
                h.pop('Authorization', None)
                r = requests.get(
                    f'https://api.github.com/repos/{owner}/{repo}',
                    headers=h, timeout=10,
                )
            if r.status_code == 404:
                return {'error': 'Could not fetch repository. The repository may not exist or is private.'}
            if r.status_code in (403, 429):
                token = _gh_token_pool.rotate()
                continue
            if r.status_code != 200:
                return []
            branch = r.json().get('default_branch', 'main')
            break
        except Exception:
            return []
    else:
        return {'error': 'GitHub API rate limit reached on all configured tokens. Please try again in a few minutes.'}

    for attempt in range(attempts):
        h = _gh_headers(token)
        try:
            r = requests.get(
                f'https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1',
                headers=h, timeout=15,
            )
            if r.status_code == 401:
                h.pop('Authorization', None)
                r = requests.get(
                    f'https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1',
                    headers=h, timeout=15,
                )
            if r.status_code in (403, 429):
                token = _gh_token_pool.rotate()
                continue
            if r.status_code != 200:
                return []
            return [
                item['path']
                for item in r.json().get('tree', [])
                if item.get('type') == 'blob'
            ]
        except Exception:
            return []

    return {'error': 'GitHub API rate limit reached. Please try again in a few minutes.'}



def _fetch_file_content(owner: str, repo: str, file_path: str, token: str):
    """Fetch and decode a single file from GitHub. Returns text or None."""
    h = _gh_headers(token)
    url = f'https://api.github.com/repos/{owner}/{repo}/contents/{file_path}'
    try:
        r = requests.get(url, headers=h, timeout=8)
        if r.status_code == 401:
            h.pop('Authorization', None)
            r = requests.get(url, headers=h, timeout=8)
        if r.status_code != 200:
            return None
        data = r.json()
        if data.get('encoding') == 'base64' and data.get('content'):
            return base64.b64decode(data['content']).decode('utf-8', errors='replace')[:8000]
    except Exception:
        pass
    return None


# ── AI review ────────────────────────────────────────────────────────────────

def _review_single_file(owner: str, repo: str, file_path: str, token: str):
    """
    Review one source file with Groq AI.
    Returns dict(file, file_score, issues) or None on failure.
    """
    content = _fetch_file_content(owner, repo, file_path, token)
    if not content or len(content.strip()) < 30:
        return None

    system = (
        "You are a principal software engineer at Google with 15+ years of experience. "
        "You perform thorough, constructive code reviews. Return ONLY valid JSON, no extra text."
    )
    prompt = (
        f"Review this source code file and identify ALL issues a senior engineer would flag.\n\n"
        f"File: {file_path}\n```\n{content}\n```\n\n"
        "For each issue, provide:\n"
        "- line: approximate line number (integer, 1 if unknown)\n"
        "- type: category like \"SQL Injection\", \"Hardcoded Secret\", \"N+1 Query\", "
        "\"Missing Error Handling\", \"Dead Code\", \"Security Vulnerability\", "
        "\"Anti-Pattern\", \"Performance Issue\", \"Missing Validation\", \"Code Smell\"\n"
        "- severity: one of \"critical\", \"high\", \"medium\", \"low\"\n"
        "- code_snippet: offending code (max 120 chars)\n"
        "- description: why this is a problem (max 200 chars)\n"
        "- fix: concrete fix suggestion (max 250 chars)\n\n"
        "Also provide file_score 0-100 (100=perfect).\n\n"
        f"Return ONLY this JSON:\n"
        "{\"file\": \"" + file_path + "\", \"file_score\": 85, \"issues\": ["
        "{\"line\": 1, \"type\": \"...\", \"severity\": \"critical\", "
        "\"code_snippet\": \"...\", \"description\": \"...\", \"fix\": \"...\"}]}"
    )
    try:
        text = _call_groq(prompt, system=system, temperature=0.1)
        text = text.strip()
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        m = re.search(r'\{.*\}', text, re.DOTALL)
        if m:
            result = json.loads(m.group())
            result.setdefault('file', file_path)
            result.setdefault('file_score', 70)
            result.setdefault('issues', [])
            return result
    except Exception as e:
        print(f'[CodeReview] Failed for {file_path}: {e}')
    return None


# ── Roadmap ───────────────────────────────────────────────────────────────────

def _build_refactoring_roadmap(file_results: list) -> list:
    """Derive a prioritised 5-step refactoring roadmap from review results."""
    order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
    all_issues = []
    for fr in file_results:
        for iss in fr.get('issues', []):
            iss['_file'] = fr['file']
            all_issues.append(iss)
    all_issues.sort(key=lambda x: order.get(x.get('severity', 'low'), 3))

    seen, steps = set(), []
    for iss in all_issues:
        itype = iss.get('type', 'General')
        if itype not in seen:
            seen.add(itype)
            steps.append({
                'step': len(steps) + 1,
                'title': f'Fix {itype} issues',
                'severity': iss.get('severity', 'medium'),
                'example_file': iss.get('_file', ''),
                'description': iss.get('description', ''),
                'fix': iss.get('fix', ''),
            })
        if len(steps) >= 5:
            break

    generics = [
        ('Add comprehensive error handling', 'medium',
         'Wrap critical code paths in try/except with meaningful messages.',
         'Add try/except with logging around DB queries, external calls, and file I/O.'),
        ('Write unit tests for core modules', 'low',
         'Coverage increases confidence and catches regressions early.',
         'Add pytest/jest suites with at least 70% coverage on business logic.'),
        ('Document public APIs and functions', 'low',
         'Missing docstrings slow down onboarding.',
         'Add docstrings to all public functions and update README with endpoint docs.'),
    ]
    for title, sev, desc, fix in generics:
        if len(steps) >= 5:
            break
        steps.append({
            'step': len(steps) + 1,
            'title': title, 'severity': sev,
            'example_file': '',
            'description': desc, 'fix': fix,
        })
    return steps[:5]


# ── Public API ────────────────────────────────────────────────────────────────

def review_github_repo(owner: str, repo: str, token: str = '') -> dict:
    """
    Full AI code review of a public GitHub repository.
    Returns a structured report dict.
    """
    if not token:
        token = _gh_token_pool.get()
    all_paths = _get_repo_file_tree(owner, repo, token)
    # Handle error dict returned by _get_repo_file_tree (rate limit, 404, etc.)
    if isinstance(all_paths, dict) and 'error' in all_paths:
        return all_paths
    if not all_paths:
        return {'error': 'Could not fetch repository file tree. Make sure the repo is public.'}

    priority = ('src/', 'app/', 'api/', 'backend/', 'lib/', 'core/')
    
    # Prioritize functional core code files first (ignoring html/css to speed up and filter noise)
    core_exts = _REVIEWABLE_EXTENSIONS - {'.html', '.css'}
    to_review = [p for p in all_paths if _should_review(p, core_exts)]
    
    # Fallback to all reviewable files if no core logic files found
    if not to_review:
        to_review = [p for p in all_paths if _should_review(p)]

    original_reviewable_count = len(to_review)
    to_review.sort(key=lambda p: (0 if any(p.startswith(x) for x in priority) else 1, p))
    to_review = to_review[:25]  # Cap at 25 files for fast responses

    if not to_review:
        return {'error': 'No reviewable source files found in this repository.'}

    print(f'[CodeReview] Reviewing {len(to_review)} files in {owner}/{repo}')

    file_results = []
    with _cf.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(_review_single_file, owner, repo, path, token): path
            for path in to_review
        }
        for future in _cf.as_completed(futures):
            try:
                result = future.result()
                if result is not None:
                    file_results.append(result)
            except Exception as e:
                print(f'[CodeReview] Thread error: {e}')

    if not file_results:
        return {'error': 'AI review returned no results. Please try again.'}

    severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
    total_issues = 0
    for fr in file_results:
        for iss in fr.get('issues', []):
            s = iss.get('severity', 'low')
            if s in severity_counts:
                severity_counts[s] += 1
            total_issues += 1

    scores = [fr.get('file_score', 70) for fr in file_results]
    overall = round(sum(scores) / len(scores)) if scores else 50
    overall = max(0, overall - severity_counts['critical'] * 5 - severity_counts['high'] * 2)
    overall = min(100, overall)

    file_results.sort(key=lambda f: f.get('file_score', 70))
    roadmap = _build_refactoring_roadmap(file_results)

    return {
        'owner':                  owner,
        'repo':                   repo,
        'total_files_count':      len(all_paths),
        'reviewable_files_count': original_reviewable_count,
        'files_reviewed':         len(file_results),
        'overall_score':          overall,
        'total_issues':           total_issues,
        'severity_counts':        severity_counts,
        'files':                  file_results,
        'roadmap':                roadmap,
    }
