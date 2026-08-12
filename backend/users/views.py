from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings as django_settings
from django.utils import timezone
from .models import UserProfile, Resume
from .serializers import (
    RegisterSerializer, UserSerializer,
    UpdateProfileSerializer, LeaderboardSerializer,
    ResumeSerializer,
)
from core.gemini_client import parse_resume_from_text, audit_resume_ats, tailor_resume_ats

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Account is inactive.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        })


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = request.user
        profile = getattr(user, 'profile', None)
        if not profile:
            profile = UserProfile.objects.create(user=user)
        serializer = UpdateProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)


class LeaderboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        profiles = UserProfile.objects.select_related('user').order_by('-total_xp')[:50]
        data = []
        for i, profile in enumerate(profiles):
            s = LeaderboardSerializer(profile, context={'rank_position': i + 1})
            data.append(s.data)
        return Response(data)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class GitHubConnectView(APIView):
    """Connect a GitHub username and trigger an initial repo scan."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        username = request.data.get('username', '').strip()
        if not username:
            return Response({'error': 'GitHub username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Sanitize — only alphanumeric + hyphens allowed in GitHub usernames
        import re
        if not re.match(r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,37}[a-zA-Z0-9])?$', username):
            return Response({'error': 'Invalid GitHub username format.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if username is already connected to ANOTHER user account
        taken = UserProfile.objects.filter(
            github_username__iexact=username,
            github_connected=True
        ).exclude(user=request.user).first()
        if taken:
            return Response(
                {'error': f'GitHub profile "@{username}" is already connected to another Nexora user account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        # If current user already connected this SAME username and has existing cached data
        if profile.github_connected and profile.github_username.lower() == username.lower() and profile.github_repos_json:
            return Response({
                'username':          profile.github_username,
                'code_health_score': profile.code_health_score,
                'repos':             profile.github_repos_json,
                'repo_count':        len(profile.github_repos_json),
                'cached':            True,
                'message':           'GitHub account is already connected.'
            }, status=status.HTTP_200_OK)

        profile.github_username = username
        profile.github_connected = True
        profile.save()

        # Trigger initial scan
        return _run_github_scan(request.user, profile)


class GitHubScanView(APIView):
    """Re-scan GitHub repos (cached for 1 hour)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.github_connected:
            return Response({'error': 'GitHub not connected.'}, status=status.HTTP_400_BAD_REQUEST)

        # Return cached data if scanned within the last hour
        if profile.github_scanned_at:
            elapsed = (timezone.now() - profile.github_scanned_at).total_seconds()
            if elapsed < 3600 and profile.github_repos_json:
                return Response({
                    'username':          profile.github_username,
                    'code_health_score': profile.code_health_score,
                    'repos':             profile.github_repos_json,
                    'repo_count':        len(profile.github_repos_json),
                    'cached':            True,
                })

        return _run_github_scan(request.user, profile)


def _run_github_scan(user, profile):
    """Internal helper: call GitHub API and store results."""
    from core.gemini_client import score_github_repos
    github_token = getattr(django_settings, 'GITHUB_TOKEN', '')
    result = score_github_repos(profile.github_username, github_token)

    if 'error' in result:
        return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)

    new_score = result.get('overall_score', 0)
    repos = result.get('repos', [])

    if repos:
        profile.github_repos_json = repos
        # Only update score if: no existing score yet, or new score is HIGHER than current.
        # This prevents the AI from arbitrarily lowering the score on every rescan.
        if profile.code_health_score == 0:
            profile.code_health_score = new_score
        elif new_score > profile.code_health_score:
            profile.code_health_score = new_score
    elif not profile.github_repos_json and new_score > 0:
        profile.code_health_score = new_score

    profile.github_scanned_at = timezone.now()
    profile.save()

    return Response({
        'username':          profile.github_username,
        'code_health_score': profile.code_health_score,
        'repos':             profile.github_repos_json,
        'repo_count':        len(profile.github_repos_json),
        'top_languages':     result.get('top_languages', []),
        'cached':            False,
    })


class GitHubDisconnectView(APIView):
    """Disconnect connected GitHub username and clear stored repository details."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.github_connected:
            return Response({'error': 'No GitHub account connected.'}, status=status.HTTP_400_BAD_REQUEST)

        profile.github_username = ''
        profile.github_connected = False
        profile.code_health_score = 0
        profile.github_repos_json = []
        profile.github_scanned_at = None
        profile.save()

        return Response({'message': 'GitHub account disconnected successfully.'})


# ─────────────────────────────────────────────────────────────────────────────
# Resume Suite Views
# ─────────────────────────────────────────────────────────────────────────────

class ResumeGetOrCreateView(APIView):
    """GET: load user's resume. PUT: save/update resume sections."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        resume, _ = Resume.objects.get_or_create(user=request.user)
        return Response(ResumeSerializer(resume).data)

    def put(self, request):
        resume, _ = Resume.objects.get_or_create(user=request.user)
        WRITABLE = ('personal_info', 'experience', 'projects', 'skills',
                    'education', 'certifications', 'target_role')
        for field in WRITABLE:
            if field in request.data:
                setattr(resume, field, request.data[field])
        resume.save()
        return Response(ResumeSerializer(resume).data)


class ResumeAnalyzeView(APIView):
    """POST: upload a PDF/TXT resume, parse via AI, save sections + run ATS audit."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        ext = uploaded.name.lower().split('.')[-1]
        raw_text = ''

        try:
            if ext == 'pdf':
                from pypdf import PdfReader
                import io
                file_bytes = uploaded.read()
                reader = PdfReader(io.BytesIO(file_bytes))
                # Strategy 1: standard extract_text with layout mode
                raw_text = '\n'.join(page.extract_text(extraction_mode='layout') or '' for page in reader.pages)
                # Strategy 2: fallback to plain extract_text
                if not raw_text.strip():
                    raw_text = '\n'.join(page.extract_text() or '' for page in reader.pages)
                # Strategy 3: visitor approach for complex PDFs
                if not raw_text.strip():
                    parts = []
                    for page in reader.pages:
                        try:
                            def visitor(text, cm, tm, font, font_size):
                                if text.strip():
                                    parts.append(text)
                            page.extract_text(visitor_text=visitor)
                        except Exception:
                            pass
                    raw_text = ' '.join(parts)
            elif ext == 'txt':
                raw_text = uploaded.read().decode('utf-8', errors='ignore')
            else:
                return Response({'error': 'Only PDF and TXT files are supported.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'File reading failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        if not raw_text.strip():
            return Response({
                'error': 'Could not extract text from this PDF. Your PDF may be scanned or image-based. Please try a different PDF (text-based) or copy your resume content into a .TXT file and upload that instead.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # AI parse
        parsed = parse_resume_from_text(raw_text)

        # Save to Resume model
        resume, _ = Resume.objects.get_or_create(user=request.user)
        resume.personal_info   = parsed.get('personal_info', {})
        resume.experience      = parsed.get('experience', [])
        resume.projects        = parsed.get('projects', [])
        resume.skills          = parsed.get('skills', [])
        resume.education       = parsed.get('education', [])
        resume.certifications  = parsed.get('certifications', [])
        resume.custom_sections = parsed.get('custom_sections', [])

        # Auto-run ATS audit using existing target_role or a generic one
        target_role = resume.target_role or 'Software Developer'
        audit = audit_resume_ats(parsed, target_role)
        resume.ats_score    = audit.get('ats_score', 0)
        resume.audit_report = audit
        resume.save()

        return Response({
            'resume': ResumeSerializer(resume).data,
            'parsed_sections': list(parsed.keys()),
        }, status=status.HTTP_200_OK)


class ResumeAuditView(APIView):
    """POST: run ATS audit on the current saved resume for a given target_role."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_role = request.data.get('target_role', '').strip()

        try:
            resume = Resume.objects.get(user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'No resume found. Please build or upload your resume first.'}, status=status.HTTP_404_NOT_FOUND)

        if not target_role:
            target_role = resume.target_role or 'Software Developer'

        resume_data = ResumeSerializer(resume).data
        # Strip non-resume fields so keyword matching stays deterministic
        clean_resume_data = {k: v for k, v in dict(resume_data).items()
                             if k not in ('audit_report', 'ats_score', 'target_role',
                                          'is_premium_unlocked', 'id', 'created_at', 'updated_at')}
        audit = audit_resume_ats(clean_resume_data, target_role)

        resume.target_role  = target_role
        resume.ats_score    = audit.get('ats_score', 0)
        resume.audit_report = audit
        resume.save()

        return Response({
            'ats_score':    audit.get('ats_score'),
            'target_role':  target_role,
            'audit_report': audit,
        })


class ResumePremiumUnlockView(APIView):
    """POST: simulate premium purchase — unlocks premium templates."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        resume, _ = Resume.objects.get_or_create(user=request.user)
        resume.is_premium_unlocked = True
        resume.save()
        return Response({
            'message': 'Premium unlocked! All templates are now available.',
            'is_premium_unlocked': True,
        })


class ResumeTailorView(APIView):
    """POST: Tailor resume data against a Job Description, returning ATS score, missing skills and suggestions."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        job_description = request.data.get('job_description', '').strip()

        try:
            resume = Resume.objects.get(user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'No resume found. Please build or upload your resume first.'}, status=status.HTTP_404_NOT_FOUND)

        if not job_description:
            job_description = resume.target_role or 'General Software Engineer Role'

        resume_data = ResumeSerializer(resume).data
        # Strip non-resume fields so keyword matching stays deterministic
        clean_resume_data = {k: v for k, v in dict(resume_data).items()
                             if k not in ('audit_report', 'ats_score', 'target_role',
                                          'is_premium_unlocked', 'id', 'created_at', 'updated_at')}
        tailored_report = tailor_resume_ats(clean_resume_data, job_description)

        resume.ats_score = tailored_report.get('ats_score', resume.ats_score)
        resume.audit_report = tailored_report
        resume.save()

        return Response(tailored_report, status=status.HTTP_200_OK)



from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationReadAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read.'}, status=status.HTTP_200_OK)


class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(user=request.user, id=pk)
            notif.is_read = True
            notif.save()
            return Response({'message': 'Notification marked as read.'}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)


class NotificationClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        Notification.objects.filter(user=request.user).delete()
        return Response({'message': 'All notifications cleared.'}, status=status.HTTP_200_OK)


import requests

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            print("[GoogleLoginView Error] Token missing in request")
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate token with Google tokeninfo endpoint
        try:
            response = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=10)
        except Exception as e:
            print(f"[GoogleLoginView Error] Failed to connect to Google: {str(e)}")
            return Response({'error': f'Failed to connect to Google authentication server: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if response.status_code != 200:
            print(f"[GoogleLoginView Error] Google token validation failed ({response.status_code}): {response.text}")
            return Response({'error': f'Invalid or expired Google token (Code {response.status_code}).'}, status=status.HTTP_400_BAD_REQUEST)

        token_info = response.json()
        
        # Verify the Client ID (audience) matches ours
        expected_client_ids = {
            '677409406492-44in3v5m8b3ns1hg8dt66giul3r7nji7.apps.googleusercontent.com',
            '262401890252-9rvc6los0skfju4i5om4jqvqnnlj606p.apps.googleusercontent.com',
            str(getattr(django_settings, 'GOOGLE_CLIENT_ID', '')).strip()
        }
        aud = token_info.get('aud')
        if aud not in expected_client_ids:
            print(f"[GoogleLoginView Error] Audience mismatch. Token aud: '{aud}', Expected set: '{expected_client_ids}'")
            return Response({'error': 'Audience mismatch. Client ID does not match expected client ID.'}, status=status.HTTP_400_BAD_REQUEST)

        email = token_info.get('email')
        if not email:
            print("[GoogleLoginView Error] Email missing in Google token_info")
            return Response({'error': 'Google account email not found in token.'}, status=status.HTTP_400_BAD_REQUEST)

        full_name = token_info.get('name') or email.split('@')[0]

        User = get_user_model()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'is_active': True
            }
        )

        if created:
            user.set_unusable_password()
            user.save()
        
        # Ensure UserProfile always exists
        UserProfile.objects.get_or_create(user=user)

        refresh = RefreshToken.for_user(user)
        
        print(f"[GoogleLoginView Success] User authenticated: {email}")
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)


from .memory_service import get_or_create_ai_memory, record_module_activity

class AIMemoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        memory = get_or_create_ai_memory(request.user)
        return Response({
            'skills_mastery': memory.skills_mastery,
            'strengths': memory.strengths,
            'weaknesses': memory.weaknesses,
            'recurring_mistakes': memory.recurring_mistakes,
            'career_goals': memory.career_goals,
            'learning_habits': memory.learning_habits,
            'activity_log': memory.activity_log[:30],
            'ai_summary': memory.ai_summary,
            'updated_at': memory.updated_at
        }, status=status.HTTP_200_OK)


class RecordActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        module_name = request.data.get('module')
        action_title = request.data.get('action')
        details = request.data.get('details', {})
        if not module_name or not action_title:
            return Response({'error': 'Module name and action title are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        memory = record_module_activity(request.user, module_name, action_title, details)
        return Response({
            'message': 'Activity recorded in AI Memory Engine.',
            'activity_log': memory.activity_log[:10] if memory else []
        }, status=status.HTTP_200_OK)


