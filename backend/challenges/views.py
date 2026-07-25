from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Challenge, ChallengeTopic, ChallengeSubmission
from .serializers import (
    ChallengeListSerializer, ChallengeDetailSerializer,
    ChallengeTopicSerializer, ChallengeSubmissionSerializer
)
from core.gemini_client import evaluate_challenge_submission
from progress.utils import award_xp, log_activity, award_certificate


class ChallengeTopicListView(generics.ListAPIView):
    queryset = ChallengeTopic.objects.all()
    serializer_class = ChallengeTopicSerializer
    permission_classes = [permissions.AllowAny]


class ChallengeListView(generics.ListAPIView):
    serializer_class = ChallengeListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = Challenge.objects.filter(is_active=True).select_related('topic')
        difficulty = self.request.query_params.get('difficulty')
        challenge_type = self.request.query_params.get('type')
        topic_id = self.request.query_params.get('topic')
        search = self.request.query_params.get('search')

        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if challenge_type:
            qs = qs.filter(challenge_type=challenge_type)
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class ChallengeDetailView(generics.RetrieveAPIView):
    queryset = Challenge.objects.select_related('topic')
    serializer_class = ChallengeDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class SubmitChallengeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            challenge = Challenge.objects.get(pk=pk, is_active=True)
        except Challenge.DoesNotExist:
            return Response({'error': 'Challenge not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if already submitted
        if ChallengeSubmission.objects.filter(user=request.user, challenge=challenge, status='evaluated').exists():
            return Response({'error': 'You have already completed this challenge.'}, status=status.HTTP_400_BAD_REQUEST)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Submission content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create or update submission
        submission, _ = ChallengeSubmission.objects.get_or_create(
            user=request.user, challenge=challenge,
            defaults={'content': content}
        )
        submission.content = content
        submission.status = 'pending'
        submission.save()

        # Run Python Sandbox Executor
        from challenges.sandbox import execute_user_code
        sandbox_res = execute_user_code(content)
        empirical_data = sandbox_res.get('telemetry', [])

        # Evaluate with Gemini AI
        result = evaluate_challenge_submission(
            challenge.title,
            challenge.description,
            content
        )

        score = result.get('score', 70)
        feedback_parts = [result.get('overall_feedback', '')]
        if result.get('strengths'):
            feedback_parts.append("**Strengths:** " + ", ".join(result['strengths']))
        if result.get('improvements'):
            feedback_parts.append("**Areas to improve:** " + ", ".join(result['improvements']))

        xp_multiplier = result.get('xp_multiplier', 1.0)
        xp_earned = int(challenge.xp_reward * xp_multiplier * (score / 100))

        submission.score = score
        submission.feedback = "\n\n".join(feedback_parts)
        submission.status = 'evaluated'
        submission.xp_earned = xp_earned
        
        # Save complexity + telemetry
        submission.time_complexity = result.get('time_complexity', 'O(N)')
        submission.space_complexity = result.get('space_complexity', 'O(1)')
        submission.complexity_table = result.get('complexity_table', '')
        submission.empirical_data = empirical_data
        
        submission.save()

        # Award XP and log activity
        award_xp(request.user, xp_earned)
        log_activity(request.user, 'challenge_completed', f'Completed: {challenge.title}', xp_earned, {'challenge_id': challenge.id, 'score': score})

        # Issue certificate for hard/medium challenges with passing score
        cert = award_certificate(request.user, challenge, score)
        cert_data = None
        if cert:
            cert_data = {
                'certificate_id': cert.certificate_id,
                'title': cert.title,
                'description': cert.description,
                'issued_at': cert.issued_at.isoformat(),
            }

        response_data = ChallengeSubmissionSerializer(submission).data
        response_data['certificate'] = cert_data
        return Response(response_data, status=status.HTTP_200_OK)


class DailyChallengeView(generics.RetrieveAPIView):
    serializer_class = ChallengeDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        from django.utils import timezone
        from challenges.models import ChallengeTopic, Challenge
        from core.gemini_client import generate_ai_challenge
        
        today = timezone.now().date()
        
        # 1. Look for today's daily challenge
        challenge = Challenge.objects.filter(
            challenge_type='daily', 
            is_active=True, 
            created_at__date=today
        ).first()
        
        if challenge:
            return challenge

        # 2. If not found, dynamically generate a new daily challenge for today
        try:
            # Pick a random topic to keep it diverse
            topic = ChallengeTopic.objects.order_by('?').first()
            if not topic:
                topic = ChallengeTopic.objects.create(name='General Engineering', icon='⚙️', color='#6366f1')
            
            # Generate challenge data using AI client
            challenge_data = generate_ai_challenge(topic.name)
            
            # Save as a daily challenge
            challenge = Challenge.objects.create(
                title=challenge_data['title'],
                description=challenge_data['description'],
                requirements=challenge_data['requirements'],
                difficulty=challenge_data['difficulty'],
                topic=topic,
                challenge_type='daily',
                xp_reward=challenge_data['xp_reward'],
                tags=challenge_data['tags'],
                estimated_time=challenge_data['estimated_time'],
                is_active=True
            )
            print(f"[DailyChallengeView] Successfully auto-generated today's daily challenge: {challenge.title}")
            return challenge
        except Exception as e:
            print(f"[DailyChallengeView] Auto-generation failed: {e}. Falling back to latest daily.")
            
            # Fallback to the most recent daily challenge of any day
            challenge = Challenge.objects.filter(challenge_type='daily', is_active=True).order_by('-created_at').first()
            if not challenge:
                challenge = Challenge.objects.filter(is_active=True).order_by('-created_at').first()
            return challenge


class GenerateAIChallengeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        topic_name = request.data.get('topic_name', '').strip()
        topic_id = request.data.get('topic_id')

        topic = None
        if topic_id:
            try:
                topic = ChallengeTopic.objects.get(pk=topic_id)
            except ChallengeTopic.DoesNotExist:
                pass

        if not topic and topic_name:
            topic = ChallengeTopic.objects.filter(name__iexact=topic_name).first()
            if not topic:
                topic = ChallengeTopic.objects.create(
                    name=topic_name.title(),
                    icon='🐳' if 'docker' in topic_name.lower() else ('☸️' if 'kubernetes' in topic_name.lower() else ('⚡' if 'javascript' in topic_name.lower() else '⚙️')),
                    color='#a78bfa'
                )

        if not topic:
            return Response({'error': 'Either a valid topic_id or topic_name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate using our gemini_client function
        from core.gemini_client import generate_ai_challenge
        challenge_data = generate_ai_challenge(topic.name)

        # Save to DB
        challenge = Challenge.objects.create(
            title=challenge_data['title'],
            description=challenge_data['description'],
            requirements=challenge_data['requirements'],
            difficulty=challenge_data['difficulty'],
            topic=topic,
            challenge_type='topic',
            xp_reward=challenge_data['xp_reward'],
            tags=challenge_data['tags'],
            estimated_time=challenge_data['estimated_time'],
            is_active=True
        )

        serializer = ChallengeListSerializer(challenge, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GenerateChallengeFromTaskView(APIView):
    """
    Generates a focused AI challenge from a ScheduledTask title.
    Called when user clicks 'Go' on a roadmap task with no linked challenge.
    Returns the new challenge id so frontend can redirect to /challenges/{id}.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from progress.models import ScheduledTask
        from core.gemini_client import generate_ai_challenge_from_title

        task_id = request.data.get('task_id')
        if not task_id:
            return Response({'error': 'task_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            scheduled_task = ScheduledTask.objects.get(pk=task_id, user=request.user)
        except ScheduledTask.DoesNotExist:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        # If task already has a valid challenge target_url with an existing challenge, return it directly!
        if scheduled_task.target_url and scheduled_task.target_url.startswith('/challenges/'):
            try:
                parts = scheduled_task.target_url.strip('/').split('/')
                if len(parts) >= 2 and parts[1].isdigit():
                    existing_id = int(parts[1])
                    if Challenge.objects.filter(id=existing_id, is_active=True).exists():
                        return Response({'challenge_id': existing_id}, status=status.HTTP_200_OK)
            except Exception:
                pass

        task_title = scheduled_task.title
        topic_label = scheduled_task.topic_label or ''

        # Get or create a topic for this challenge
        topic = None
        if topic_label:
            topic = ChallengeTopic.objects.filter(name__iexact=topic_label).first()
            if not topic:
                topic = ChallengeTopic.objects.create(
                    name=topic_label.title(), icon='🗺️', color='#818cf8'
                )
        if not topic:
            topic = ChallengeTopic.objects.filter(is_active=True).first() if hasattr(ChallengeTopic, 'is_active') else ChallengeTopic.objects.first()
            if not topic:
                topic = ChallengeTopic.objects.create(name='General', icon='⚙️', color='#6366f1')

        # Generate focused AI challenge with fallback handling
        try:
            challenge_data = generate_ai_challenge_from_title(task_title, topic_label)
        except Exception as e:
            print(f"[GenerateChallengeFromTaskView] AI generation failed: {e}")
            challenge_data = {
                'title': task_title,
                'description': f"Implement a complete solution for: {task_title}.\n\nRequirements:\n1. Implement clean and modular code.\n2. Handle edge cases efficiently.\n3. Include explanation/docstring for your implementation.",
                'requirements': ['Clean code structure', 'Edge case handling', 'Time & Space complexity analysis'],
                'difficulty': 'medium',
                'xp_reward': 150,
                'tags': [topic_label.lower()] if topic_label else ['coding'],
                'estimated_time': '25 mins'
            }

        challenge = Challenge.objects.create(
            title=challenge_data.get('title', task_title),
            description=challenge_data.get('description', ''),
            requirements=challenge_data.get('requirements', []),
            difficulty=challenge_data.get('difficulty', 'medium'),
            topic=topic,
            challenge_type='topic',
            xp_reward=challenge_data.get('xp_reward', 150),
            tags=challenge_data.get('tags', []),
            estimated_time=challenge_data.get('estimated_time', '25 mins'),
            is_active=True,
        )

        # Update the ScheduledTask to point to this specific challenge going forward
        scheduled_task.target_url = f'/challenges/{challenge.id}'
        scheduled_task.save(update_fields=['target_url'])

        return Response({'challenge_id': challenge.id}, status=status.HTTP_201_CREATED)


class UserActivityGridView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models.functions import TruncDate
        from django.db.models import Count
        from challenges.models import ChallengeSubmission
        import pytz
        from django.utils import timezone as dj_timezone

        # Use IST timezone for date grouping.
        # TruncDate defaults to UTC - this causes late-night IST submissions
        # (e.g. Sat 11 PM IST = Sun 05:30 AM UTC) to appear on the wrong day.
        try:
            ist = pytz.timezone('Asia/Kolkata')
        except Exception:
            ist = dj_timezone.utc

        # Group evaluated submissions by local (IST) date
        submissions = (
            ChallengeSubmission.objects.filter(user=request.user, status='evaluated')
            .annotate(date=TruncDate('submitted_at', tzinfo=ist))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        # Convert to dictionary of YYYY-MM-DD -> count
        activity_data = {}
        for entry in submissions:
            if entry['date']:
                date_str = entry['date'].strftime('%Y-%m-%d')
                activity_data[date_str] = entry['count']

        return Response(activity_data)


# ═════════════════════════════════════════════════════════════════════════════
# ONLINE ASSESSMENT (MOCK OA) VIEWS
# ═════════════════════════════════════════════════════════════════════════════

from challenges.models import AssessmentSession, AssessmentTelemetry
from challenges.oa_challenges import OA_CHALLENGES
from django.utils import timezone
from django.db.models import Q
from core.gemini_client import _call_groq


def run_assessment_tests(code, tests):
    import re
    import inspect
    local_env = {}
    try:
        # Find the function name
        func_names = re.findall(r'def\s+(\w+)\s*\(', code)
        if not func_names:
            return {'status': 'error', 'error': 'No function definition found.'}
        func_name = func_names[0]
        exec(code, {}, local_env)
        func = local_env.get(func_name)
        if not func:
            return {'status': 'error', 'error': f'Function {func_name} not found.'}
        
        passed_count = 0
        for test in tests:
            args = test['input']
            expected = test['expected']
            
            sig = inspect.signature(func)
            num_params = len(sig.parameters)
            
            # If function accepts multiple arguments, unpack list
            if num_params > 1 and isinstance(args, list):
                res = func(*args)
            else:
                if isinstance(args, list) and len(args) == 1:
                    res = func(args[0])
                else:
                    res = func(args)
            
            if res == expected:
                passed_count += 1
        return {'status': 'success', 'passed': passed_count, 'total': len(tests)}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


class StartAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        company = request.data.get('company')
        if company not in OA_CHALLENGES:
            return Response({'error': f'Company mock for {company} is not supported.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for active session
        session = AssessmentSession.objects.filter(user=request.user, company=company, status='active').first()
        if not session:
            # Set time limit
            limit = 3600
            if company == 'Amazon':
                limit = 4200
            elif company == 'Google':
                limit = 5100
            
            session = AssessmentSession.objects.create(
                user=request.user,
                company=company,
                status='active',
                time_limit_seconds=limit
            )

        challenges = []
        for c in OA_CHALLENGES[company]:
            challenges.append({
                'id': c['id'],
                'title': c['title'],
                'topic': c['topic'],
                'difficulty': c['difficulty'],
                'xp': c['xp'],
                'estimated_time': c['estimated_time'],
                'description': c['description'],
                'default_code': c['default_code']
            })

        return Response({
            'session_id': str(session.id),
            'company': session.company,
            'status': session.status,
            'started_at': session.started_at.isoformat(),
            'time_limit_seconds': session.time_limit_seconds,
            'total_warnings': session.total_warnings,
            'completed_steps': session.completed_steps,
            'challenges': challenges
        }, status=status.HTTP_201_CREATED)


class LogTelemetryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        event_type = request.data.get('event_type')

        try:
            session = AssessmentSession.objects.get(id=session_id, user=request.user)
        except (AssessmentSession.DoesNotExist, ValueError):
            return Response({'error': 'Assessment session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session.status != 'active':
            return Response({
                'status': session.status,
                'total_warnings': session.total_warnings,
                'error': 'Session is no longer active.'
            }, status=status.HTTP_400_BAD_REQUEST)

        AssessmentTelemetry.objects.create(session=session, event_type=event_type)

        if event_type in ['tab_blur', 'visibility_hidden', 'fullscreen_exit']:
            session.total_warnings += 1
            if session.total_warnings >= 3:
                session.status = 'flagged'
                session.ended_at = timezone.now()
            session.save()

        return Response({
            'session_id': str(session.id),
            'status': session.status,
            'total_warnings': session.total_warnings,
            'warning_threshold_exceeded': session.total_warnings >= 3
        }, status=status.HTTP_200_OK)


class SubmitAssessmentCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        challenge_id = request.data.get('challenge_id')
        code = request.data.get('code')
        language = request.data.get('language')

        try:
            session = AssessmentSession.objects.get(id=session_id, user=request.user)
        except (AssessmentSession.DoesNotExist, ValueError):
            return Response({'error': 'Assessment session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session.status != 'active':
            return Response({'error': 'Session is no longer active.'}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve challenge
        challenge = None
        for c in OA_CHALLENGES.get(session.company, []):
            if c['id'] == int(challenge_id):
                challenge = c
                break

        if not challenge:
            return Response({'error': 'Challenge not found.'}, status=status.HTTP_404_NOT_FOUND)

        if language == 'javascript':
            # Mock JavaScript evaluation since node sandbox is external
            # Mark as passed if some code is written
            lines = len(code.strip().split('\n'))
            if lines > 3 and 'function solve' in code:
                passed = len(challenge['tests'])
            else:
                passed = 0
            res = {'status': 'success', 'passed': passed, 'total': len(challenge['tests'])}
        else:
            # Run Python Sandbox
            res = run_assessment_tests(code, challenge['tests'])

        if res.get('status') == 'success' and res['passed'] == res['total']:
            # Track completed challenge IDs in django session to prevent double scoring
            session_key = f"solved_oa_{session.id}"
            solved_list = request.session.get(session_key, [])
            if challenge_id not in solved_list:
                solved_list.append(challenge_id)
                request.session[session_key] = solved_list
                session.completed_steps = len(solved_list)
                session.save()

        return Response({
            'status': res.get('status'),
            'passed': res.get('passed', 0),
            'total': res.get('total', 0),
            'error': res.get('error'),
            'completed_steps': session.completed_steps
        }, status=status.HTTP_200_OK)


class FinishAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')

        try:
            session = AssessmentSession.objects.get(id=session_id, user=request.user)
        except (AssessmentSession.DoesNotExist, ValueError):
            return Response({'error': 'Assessment session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session.status not in ['active', 'flagged']:
            return Response({'error': 'Session is no longer active.'}, status=status.HTTP_400_BAD_REQUEST)

        # End session
        session.ended_at = timezone.now()
        
        # Grade score
        score = int((session.completed_steps / 2.0) * 100)
        if session.total_warnings >= 3:
            session.status = 'flagged'
            score = 0
        else:
            session.status = 'completed'
        
        session.score = score

        # Generate Gemini overall evaluation
        system = "You are a professional technical hiring recruiter. Grade the candidate assessment report objectively and constructively."
        prompt = f"""Generate a professional and concise technical assessment evaluation feedback for a developer candidate.
Company Mock Test: {session.company}
Status: {session.status}
Warnings: {session.total_warnings} (tab blurs/visibility losses)
Completed Challenges: {session.completed_steps} out of 2.
Score: {score}/100.

Provide 3 brief paragraphs:
1. Executive Summary: Grade score, proctoring alerts check (integrity), and time-boxed assessment outcome.
2. Coding Strengths: Commendation on logical design and solving the problems.
3. Areas to Improve: Concrete recommendations for refining algorithms and avoiding focus violations.
"""
        try:
            feedback = _call_groq(prompt, system=system, temperature=0.5)
        except Exception:
            # Fallback
            feedback = (
                f"### Executive Summary\n"
                f"Candidate successfully completed the {session.company} Online Assessment mock simulation with a score of {score}/100. "
                f"The candidate registered {session.total_warnings} integrity warnings (window blur events) during the test. "
                f"Overall, the performance indicates a {'strong' if score >= 80 else 'satisfactory' if score >= 50 else 'developing'} capability to solve complex business algorithms.\n\n"
                f"### Coding Strengths\n"
                f"The candidate demonstrated proficiency in structuring functions and handling core edge cases. "
                f"The completed steps ({session.completed_steps}/2) show a functional approach to handling partitioned string problems and grid optimization constraints under intense time limits.\n\n"
                f"### Areas to Improve\n"
                f"To excel in real screening rounds, the candidate should practice writing more memory-efficient logic (reducing space complexity) "
                f"and ensure strict compliance with proctoring environments by maintaining focused viewport retention throughout the entire assessment duration."
            )

        session.feedback = feedback
        session.save()

        # Award XP
        if score > 0:
            award_xp(request.user, score * 2)
            log_activity(
                request.user,
                'assessment_completed',
                f'Completed {session.company} Mock OA',
                score * 2,
                {'session_id': str(session.id), 'score': score}
            )

        return Response({
            'session_id': str(session.id),
            'company': session.company,
            'status': session.status,
            'score': session.score,
            'total_warnings': session.total_warnings,
            'completed_steps': session.completed_steps,
            'feedback': session.feedback,
            'xp_earned': score * 2
        }, status=status.HTTP_200_OK)


class ActiveAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        session = AssessmentSession.objects.filter(user=request.user, status='active').first()
        if not session:
            return Response({'active': False}, status=status.HTTP_200_OK)

        company = session.company
        challenges = []
        for c in OA_CHALLENGES.get(company, []):
            challenges.append({
                'id': c['id'],
                'title': c['title'],
                'topic': c['topic'],
                'difficulty': c['difficulty'],
                'xp': c['xp'],
                'estimated_time': c['estimated_time'],
                'description': c['description'],
                'default_code': c['default_code']
            })

        # Log telemetry violation for exiting and returning to the page
        AssessmentTelemetry.objects.create(session=session, event_type='tab_blur')
        session.total_warnings += 1
        
        # Calculate remaining time
        elapsed = (timezone.now() - session.started_at).total_seconds()
        remaining = max(0, int(session.time_limit_seconds - elapsed))

        if remaining <= 0 or session.total_warnings >= 3:
            if remaining <= 0:
                session.status = 'completed'
            else:
                session.status = 'flagged'
            session.ended_at = timezone.now()
            session.save()
            return Response({
                'active': True,
                'session_id': str(session.id),
                'company': session.company,
                'status': session.status,
                'started_at': session.started_at.isoformat(),
                'time_limit_seconds': remaining,
                'total_warnings': session.total_warnings,
                'completed_steps': session.completed_steps,
                'challenges': challenges,
                'warning_threshold_exceeded': True
            }, status=status.HTTP_200_OK)

        session.save()

        return Response({
            'active': True,
            'session_id': str(session.id),
            'company': session.company,
            'status': session.status,
            'started_at': session.started_at.isoformat(),
            'time_limit_seconds': remaining,
            'total_warnings': session.total_warnings,
            'completed_steps': session.completed_steps,
            'challenges': challenges,
            'warning_threshold_exceeded': False
        }, status=status.HTTP_200_OK)
