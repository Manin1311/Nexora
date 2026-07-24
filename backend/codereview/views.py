import re
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CodeReview
from .serializers import CodeReviewSerializer
from core.code_review_engine import review_github_repo


def parse_github_url(url: str):
    """
    Parse Owner and Repo name from a GitHub URL.
    Supports:
    - https://github.com/owner/repo
    - https://github.com/owner/repo.git
    - owner/repo
    """
    url = url.strip()
    # If it's just owner/repo
    if re.match(r'^[\w\-\.]+/[\w\-\.]+$', url):
        parts = url.split('/')
        return parts[0], parts[1].replace('.git', '')

    # Standard URL match
    match = re.search(r'github\.com/([\w\-\.]+)/([\w\-\.]+)', url)
    if match:
        owner = match.group(1)
        repo = match.group(2).replace('.git', '')
        return owner, repo

    return None, None


class SubmitCodeReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        repo_url = request.data.get('repo_url', '')
        force_refresh = request.data.get('force_refresh', False)

        if not repo_url:
            return Response(
                {'error': 'Repository URL is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        owner, repo = parse_github_url(repo_url)
        if not owner or not repo:
            return Response(
                {'error': 'Invalid GitHub repository URL. Must be in the format: https://github.com/owner/repo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Standardise the URL format
        clean_url = f"https://github.com/{owner}/{repo}"

        # Check for cached completed review in the last 1 hour
        one_hour_ago = timezone.now() - timezone.timedelta(hours=1)
        cached_review = CodeReview.objects.filter(
            user=request.user,
            repo_owner=owner,
            repo_name=repo,
            status='completed',
            updated_at__gte=one_hour_ago
        ).first()

        if cached_review and not force_refresh:
            serializer = CodeReviewSerializer(cached_review)
            return Response({
                'review': serializer.data,
                'cached': True
            }, status=status.HTTP_200_OK)

        # Retrieve GITHUB_TOKEN if available
        from django.conf import settings
        token = getattr(settings, 'GITHUB_TOKEN', '')


        # Create or update pending review record
        review_record, created = CodeReview.objects.update_or_create(
            user=request.user,
            repo_owner=owner,
            repo_name=repo,
            defaults={
                'repo_url': clean_url,
                'status': 'pending',
                'report_json': None,
                'overall_score': None,
            }
        )

        try:
            # Perform AI Code Review
            report = review_github_repo(owner, repo, token)
            if 'error' in report:
                review_record.status = 'failed'
                review_record.report_json = report
                review_record.save()
                error_msg = report['error']
                # Detect GitHub rate-limit error
                if 'rate limit' in error_msg.lower() or 'rate-limit' in error_msg.lower():
                    return Response(
                        {'error': 'GitHub API rate limit reached. Please try again in a few minutes.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )
                # Detect private/not found repo
                if 'could not fetch' in error_msg.lower() or 'not found' in error_msg.lower():
                    return Response(
                        {'error': 'Repository not found or is private. Please make sure the repository is public.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                return Response({'error': error_msg}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            # Extract metrics
            severity_counts = report.get('severity_counts', {})
            review_record.overall_score = report.get('overall_score', 0)
            review_record.total_issues = report.get('total_issues', 0)
            review_record.critical_count = severity_counts.get('critical', 0)
            review_record.high_count = severity_counts.get('high', 0)
            review_record.medium_count = severity_counts.get('medium', 0)
            review_record.low_count = severity_counts.get('low', 0)
            review_record.status = 'completed'
            review_record.report_json = report
            review_record.save()

            # Award user XP for submitting code reviews!
            from progress.utils import award_xp, log_activity
            xp_reward = 50
            award_xp(request.user, xp_reward)
            log_activity(
                request.user,
                'challenge_completed',
                f"Ran AI Code Review on {owner}/{repo}",
                xp_reward,
                {'repo': f"{owner}/{repo}", 'score': review_record.overall_score}
            )

            serializer = CodeReviewSerializer(review_record)
            return Response({
                'review': serializer.data,
                'cached': False
            }, status=status.HTTP_200_OK)

        except Exception as e:
            review_record.status = 'failed'
            review_record.report_json = {'error': str(e)}
            review_record.save()
            return Response(
                {'error': f"AI Code Review failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CodeReviewHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        reviews = CodeReview.objects.filter(user=request.user)
        serializer = CodeReviewSerializer(reviews, many=True)
        return Response(serializer.data)


class CodeReviewDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            review = CodeReview.objects.get(id=pk, user=request.user)
        except CodeReview.DoesNotExist:
            return Response({'error': 'Code review report not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CodeReviewSerializer(review)
        return Response(serializer.data)


class CodeRefactorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code_snippet = request.data.get('code_snippet', '')
        description = request.data.get('description', '')
        fix_suggestion = request.data.get('fix', '')
        file_path = request.data.get('file_path', '')

        if not code_snippet:
            return Response({'error': 'Code snippet is required.'}, status=status.HTTP_400_BAD_REQUEST)

        prompt = (
            f"You are a Senior Staff Engineer. Refactor the following code snippet to resolve the flagged issue.\n\n"
            f"File Path: {file_path}\n"
            f"Issue Type/Description: {description}\n"
            f"Suggested Fix: {fix_suggestion}\n\n"
            f"Original Code Snippet:\n```\n{code_snippet}\n```\n\n"
            f"Please generate the complete, secure, refactored code snippet that fixes this issue.\n"
            f"Keep comments inside the code explaining the changes.\n"
            f"Return ONLY valid JSON in this exact structure, with no extra text or markdown formatting outside the JSON:\n"
            f'{{"refactored_code": "code block here", "explanation": "brief explanation of refactoring"}}'
        )

        try:
            import json
            from core.gemini_client import _call_groq
            system = "You are a principal software engineer at Google. Return ONLY valid JSON. You must properly escape all newlines and double quotes inside string fields."
            text = _call_groq(prompt, system=system, temperature=0.1, json_mode=True)
            text = text.strip()
            # Clean markdown code blocks if any returned by LLM
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            
            m = re.search(r'\{.*\}', text, re.DOTALL)
            if m:
                json_str = m.group()
                try:
                    res = json.loads(json_str)
                    return Response(res, status=status.HTTP_200_OK)
                except json.JSONDecodeError as json_err:
                    # Robust fallback regex parser if json.loads fails due to unescaped control chars
                    print(f"[AI Refactor] Standard JSON load failed: {json_err}. Attempting regex fallback parsing.")
                    refactored_code = ""
                    explanation = ""
                    
                    # Match "refactored_code": "..."
                    # Find key "refactored_code" and capture string until it sees "explanation" key
                    code_match = re.search(r'"refactored_code"\s*:\s*"(.*?)"\s*,\s*"explanation"', json_str, re.DOTALL)
                    if not code_match:
                        code_match = re.search(r'"refactored_code"\s*:\s*"(.*)"', json_str, re.DOTALL)
                    
                    if code_match:
                        refactored_code = code_match.group(1)
                        # Replace unescaped JSON characters
                        refactored_code = refactored_code.replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')
                    
                    # Match "explanation": "..."
                    exp_match = re.search(r'"explanation"\s*:\s*"(.*?)"', json_str, re.DOTALL)
                    if exp_match:
                        explanation = exp_match.group(1).replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')
                    
                    if refactored_code or explanation:
                        return Response({
                            'refactored_code': refactored_code,
                            'explanation': explanation
                        }, status=status.HTTP_200_OK)
                    raise
            return Response({'error': 'Failed to parse refactored response from AI.'}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            return Response({'error': f"AI refactoring failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
