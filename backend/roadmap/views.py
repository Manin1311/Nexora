from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from django.db.models import Avg

from .models import LearningPath, RoadmapWeek, WeekTask
from .serializers import LearningPathSerializer, WeekTaskSerializer
from core.gemini_client import generate_learning_roadmap


def _gather_user_data(user):
    """Collect user's performance data for the AI roadmap generator."""
    from challenges.models import ChallengeSubmission
    from interviews.models import InterviewSession

    # Challenge scores grouped by topic name
    challenge_scores = {}
    submissions = ChallengeSubmission.objects.filter(
        user=user, status='evaluated'
    ).select_related('challenge__topic')
    for sub in submissions:
        topic = sub.challenge.topic.name if sub.challenge.topic else 'General'
        if topic not in challenge_scores:
            challenge_scores[topic] = []
        if sub.score is not None:
            challenge_scores[topic].append(sub.score)
    # Average per topic
    challenge_avgs = {
        t: round(sum(scores) / len(scores), 1)
        for t, scores in challenge_scores.items() if scores
    }

    # Interview scores grouped by mode
    interview_scores = {}
    sessions = InterviewSession.objects.filter(user=user, status='completed')
    for s in sessions:
        if s.score is not None:
            if s.mode not in interview_scores:
                interview_scores[s.mode] = []
            interview_scores[s.mode].append(s.score)
    interview_avgs = {
        m: round(sum(scores) / len(scores), 1)
        for m, scores in interview_scores.items() if scores
    }

    profile = getattr(user, 'profile', None)
    return {
        'challenge_scores': challenge_avgs,
        'interview_scores': interview_avgs,
        'rank':             profile.dev_rank if profile else 'explorer',
        'total_xp':         profile.total_xp if profile else 0,
        'challenges_done':  submissions.count(),
        'interviews_done':  sessions.count(),
    }


class GenerateRoadmapView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_role = request.data.get('target_role', 'fullstack_dev')

        valid_roles = [
            'faang_swe', 'frontend_dev', 'backend_dev',
            'fullstack_dev', 'devops', 'ml_engineer', 'product',
        ]
        if target_role not in valid_roles:
            return Response({'error': 'Invalid target role.'}, status=status.HTTP_400_BAD_REQUEST)

        # Deactivate any existing active roadmap
        LearningPath.objects.filter(user=request.user, is_active=True).update(is_active=False)

        # Gather user performance data
        user_data = _gather_user_data(request.user)

        # Generate weeks from AI
        weeks_data = generate_learning_roadmap(target_role, user_data)

        with transaction.atomic():
            path = LearningPath.objects.create(
                user=request.user,
                target_role=target_role,
                summary=f"Personalized roadmap for {target_role.replace('_', ' ').title()} role",
                is_active=True,
            )
            for week_dict in weeks_data:
                week = RoadmapWeek.objects.create(
                    path=path,
                    week_number=week_dict.get('week', 1),
                    focus_area=week_dict.get('focus_area', 'General'),
                    weakness_reason=week_dict.get('weakness_reason', ''),
                    xp_goal=week_dict.get('xp_goal', 300),
                )
                for task_dict in week_dict.get('tasks', []):
                    WeekTask.objects.create(
                        week=week,
                        task_type=task_dict.get('type', 'study'),
                        title=task_dict.get('title', ''),
                        description=task_dict.get('description', ''),
                        interview_mode=task_dict.get('interview_mode', ''),
                        interview_difficulty=task_dict.get('interview_difficulty', ''),
                        order=task_dict.get('order', 1),
                    )

        serializer = LearningPathSerializer(path)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RoadmapDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get the user's active roadmap."""
        path = LearningPath.objects.filter(
            user=request.user, is_active=True
        ).prefetch_related('weeks__tasks').first()
        if not path:
            return Response({'active': False, 'detail': 'No active roadmap found.'}, status=status.HTTP_200_OK)
        return Response(LearningPathSerializer(path).data)

    def delete(self, request):
        """Clear the active roadmap."""
        LearningPath.objects.filter(user=request.user, is_active=True).update(is_active=False)
        return Response({'message': 'Roadmap cleared.'})


class CompleteTaskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, task_id):
        try:
            task = WeekTask.objects.select_related('week__path').get(
                id=task_id, week__path__user=request.user
            )
        except WeekTask.DoesNotExist:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        task.is_done = not task.is_done
        task.done_at = timezone.now() if task.is_done else None
        task.save()

        # Check if all tasks in the week are done → mark week complete
        week = task.week
        all_done = week.tasks.filter(is_done=False).count() == 0
        cert_data = None
        
        if all_done:
            week.is_completed = True
            week.save()
            # Award certificate!
            from progress.utils import award_roadmap_certificate
            from progress.serializers import CertificateSerializer
            cert = award_roadmap_certificate(request.user, week)
            if cert:
                cert_data = CertificateSerializer(cert).data
        else:
            week.is_completed = False
            week.save()

        response_data = WeekTaskSerializer(task).data
        if cert_data:
            response_data['certificate_earned'] = cert_data

        return Response(response_data)


class GetTaskContentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id):
        try:
            task = WeekTask.objects.select_related('week__path').get(
                id=task_id, week__path__user=request.user
            )
        except WeekTask.DoesNotExist:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if cached
        if not task.cached_content:
            from core.gemini_client import generate_course_material
            task.cached_content = generate_course_material(task.title, task.description)
            task.save()

        return Response(task.cached_content)


# In-memory query cache for YouTube search responses to prevent quota exhaustion
YOUTUBE_SEARCH_CACHE = {}
CACHE_TTL = 86400  # 24 hours in seconds

# Static fallback map for common tech skills if YouTube API key is missing or quota is exhausted
STATIC_COURSES = {
    'data structures': {'title': 'Data Structures and Algorithms for Beginners', 'url': 'https://www.youtube.com/watch?v=8hly31xKjhc', 'thumbnail': 'https://img.youtube.com/vi/8hly31xKjhc/hqdefault.jpg'},
    'algorithms': {'title': 'Algorithms Course for Beginners', 'url': 'https://www.youtube.com/watch?v=0IAPZzGSbME', 'thumbnail': 'https://img.youtube.com/vi/0IAPZzGSbME/hqdefault.jpg'},
    'system design': {'title': 'System Design Course for Beginners', 'url': 'https://www.youtube.com/watch?v=kYyE9l9V1Sg', 'thumbnail': 'https://img.youtube.com/vi/kYyE9l9V1Sg/hqdefault.jpg'},
    'java': {'title': 'Java Tutorial for Beginners', 'url': 'https://www.youtube.com/watch?v=A74TOX803D0', 'thumbnail': 'https://img.youtube.com/vi/A74TOX803D0/hqdefault.jpg'},
    'python': {'title': 'Python for Beginners - Full Course', 'url': 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', 'thumbnail': 'https://img.youtube.com/vi/_uQrJ0TkZlc/hqdefault.jpg'},
    'c++': {'title': 'C++ Tutorial for Beginners - Full Course', 'url': 'https://www.youtube.com/watch?v=vLnPwxZdW4Y', 'thumbnail': 'https://img.youtube.com/vi/vLnPwxZdW4Y/hqdefault.jpg'},
    'distributed systems': {'title': 'Distributed Systems Lecture Series', 'url': 'https://www.youtube.com/watch?v=cQP8WApzIQQ', 'thumbnail': 'https://img.youtube.com/vi/cQP8WApzIQQ/hqdefault.jpg'},
    'react': {'title': 'React JS Full Course for Beginners', 'url': 'https://www.youtube.com/watch?v=SqcY0GlETPk', 'thumbnail': 'https://img.youtube.com/vi/SqcY0GlETPk/hqdefault.jpg'},
    'node.js': {'title': 'Node.js and Express.js Full Course', 'url': 'https://www.youtube.com/watch?v=Oe421EPjeBE', 'thumbnail': 'https://img.youtube.com/vi/Oe421EPjeBE/hqdefault.jpg'},
    'javascript': {'title': 'JavaScript Full Course for Beginners', 'url': 'https://www.youtube.com/watch?v=c-I5S_z56PM', 'thumbnail': 'https://img.youtube.com/vi/c-I5S_z56PM/hqdefault.jpg'},
    'html': {'title': 'HTML & CSS Full Course for Beginners', 'url': 'https://www.youtube.com/watch?v=mU6anWqOD4c', 'thumbnail': 'https://img.youtube.com/vi/mU6anWqOD4c/hqdefault.jpg'},
    'css': {'title': 'CSS Full Course for Beginners', 'url': 'https://www.youtube.com/watch?v=OXGznpKZ_sA', 'thumbnail': 'https://img.youtube.com/vi/OXGznpKZ_sA/hqdefault.jpg'},
    'sql': {'title': 'Learn SQL in 1 Hour - SQL Basics for Beginners', 'url': 'https://www.youtube.com/watch?v=HXV3zeQKqGY', 'thumbnail': 'https://img.youtube.com/vi/HXV3zeQKqGY/hqdefault.jpg'},
    'express': {'title': 'ExpressJS Tutorial for Beginners', 'url': 'https://www.youtube.com/watch?v=7H_QH9nipRL', 'thumbnail': 'https://img.youtube.com/vi/7H_QH9nipRL/hqdefault.jpg'},
    'rest apis': {'title': 'REST API Crash Course - Design & Development', 'url': 'https://www.youtube.com/watch?v=-MTSQjw5DrM', 'thumbnail': 'https://img.youtube.com/vi/-MTSQjw5DrM/hqdefault.jpg'},
    'tailwindicss': {'title': 'Tailwind CSS Full Course for Beginners', 'url': 'https://www.youtube.com/watch?v=lCxcTsOHr5Y', 'thumbnail': 'https://img.youtube.com/vi/lCxcTsOHr5Y/hqdefault.jpg'},
    'typescript': {'title': 'TypeScript Full Course for Beginners', 'url': 'https://www.youtube.com/watch?v=d56mG7DezGs', 'thumbnail': 'https://img.youtube.com/vi/d56mG7DezGs/hqdefault.jpg'},
    'redux': {'title': 'Redux Toolkit Tutorial for Beginners', 'url': 'https://www.youtube.com/watch?v=iBUJVy8pe1Q', 'thumbnail': 'https://img.youtube.com/vi/iBUJVy8pe1Q/hqdefault.jpg'},
    'webpack': {'title': 'Webpack Tutorial for Beginners', 'url': 'https://www.youtube.com/watch?v=X1lyVyyEsQg', 'thumbnail': 'https://img.youtube.com/vi/X1lyVyyEsQg/hqdefault.jpg'},
    'django': {'title': 'Python Django Web Framework - Full Course for Beginners', 'url': 'https://www.youtube.com/watch?v=F5mRW0b-mMM', 'thumbnail': 'https://img.youtube.com/vi/F5mRW0b-mMM/hqdefault.jpg'},
    'postgresql': {'title': 'PostgreSQL Tutorial for Beginners', 'url': 'https://www.youtube.com/watch?v=qw--VYLpxG4', 'thumbnail': 'https://img.youtube.com/vi/qw--VYLpxG4/hqdefault.jpg'},
    'docker': {'title': 'Docker for Beginners: Full Course', 'url': 'https://www.youtube.com/watch?v=fqMOX6JJhGo', 'thumbnail': 'https://img.youtube.com/vi/fqMOX6JJhGo/hqdefault.jpg'},
    'kubernetes': {'title': 'Kubernetes Course for Beginners', 'url': 'https://www.youtube.com/watch?v=d6WC5n9G_sM', 'thumbnail': 'https://img.youtube.com/vi/d6WC5n9G_sM/hqdefault.jpg'},
    'ci/cd': {'title': 'CI/CD Pipelines Explained', 'url': 'https://www.youtube.com/watch?v=scEDHsr3APg', 'thumbnail': 'https://img.youtube.com/vi/scEDHsr3APg/hqdefault.jpg'},
    'aws': {'title': 'AWS Certified Cloud Practitioner Training', 'url': 'https://www.youtube.com/watch?v=SOTamWGuqXs', 'thumbnail': 'https://img.youtube.com/vi/SOTamWGuqXs/hqdefault.jpg'},
    'linux': {'title': 'Linux for Beginners Course', 'url': 'https://www.youtube.com/watch?v=wBp0Rb-ZJak', 'thumbnail': 'https://img.youtube.com/vi/wBp0Rb-ZJak/hqdefault.jpg'},
    'terraform': {'title': 'Terraform Course for Beginners', 'url': 'https://www.youtube.com/watch?v=7xzyhDby_b8', 'thumbnail': 'https://img.youtube.com/vi/7xzyhDby_b8/hqdefault.jpg'},
    'nginx': {'title': 'Nginx Tutorial for Beginners', 'url': 'https://www.youtube.com/watch?v=JKxlsvZsAbA', 'thumbnail': 'https://img.youtube.com/vi/JKxlsvZsAbA/hqdefault.jpg'},
    'tensorflow': {'title': 'TensorFlow 2.0 Full Course for Beginners', 'url': 'https://www.youtube.com/watch?v=tPYj31viWy0', 'thumbnail': 'https://img.youtube.com/vi/tPYj31viWy0/hqdefault.jpg'},
    'pytorch': {'title': 'PyTorch for Deep Learning Bootcamp', 'url': 'https://www.youtube.com/watch?v=V_xro1bcAuA', 'thumbnail': 'https://img.youtube.com/vi/V_xro1bcAuA/hqdefault.jpg'},
    'machine learning': {'title': 'Machine Learning for Beginners Course', 'url': 'https://www.youtube.com/watch?v=NWONeJKn6kc', 'thumbnail': 'https://img.youtube.com/vi/NWONeJKn6kc/hqdefault.jpg'},
    'deep learning': {'title': 'Deep Learning Full Course - 12 Hours', 'url': 'https://www.youtube.com/watch?v=5tvmMX8r_OM', 'thumbnail': 'https://img.youtube.com/vi/5tvmMX8r_OM/hqdefault.jpg'},
    'pandas': {'title': 'Pandas Data Analysis Tutorial', 'url': 'https://www.youtube.com/watch?v=vmEHCJofHsg', 'thumbnail': 'https://img.youtube.com/vi/vmEHCJofHsg/hqdefault.jpg'},
    'numpy': {'title': 'NumPy Tutorial for Beginners', 'url': 'https://www.youtube.com/watch?v=QUT1VHiLgKQ', 'thumbnail': 'https://img.youtube.com/vi/QUT1VHiLgKQ/hqdefault.jpg'}
}

class YoutubeResourcesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        import time
        import requests
        from django.conf import settings

        query = request.query_params.get('query', '').strip()
        if not query:
            return Response({'error': 'Query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize query for lookup/caching
        normalized_query = query.lower()

        # 1. Check in-memory cache
        now = time.time()
        if normalized_query in YOUTUBE_SEARCH_CACHE:
            cached_data, timestamp = YOUTUBE_SEARCH_CACHE[normalized_query]
            if now - timestamp < CACHE_TTL:
                return Response(cached_data)

        # 2. Get YouTube API Key from settings
        api_key = getattr(settings, 'YOUTUBE_API_KEY', '')

        # 3. Call YouTube Search API if key is present
        if api_key:
            try:
                # Append "tutorial course" to get relevant educational videos
                search_query = f"{query} course tutorial"
                url = "https://www.googleapis.com/youtube/v3/search"
                params = {
                    'part': 'snippet',
                    'maxResults': 3,
                    'q': search_query,
                    'type': 'video',
                    'key': api_key
                }
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    items = data.get('items', [])
                    
                    results = []
                    for item in items:
                        video_id = item.get('id', {}).get('videoId')
                        snippet = item.get('snippet', {})
                        if video_id and snippet:
                            results.append({
                                'title': snippet.get('title'),
                                'url': f"https://www.youtube.com/watch?v={video_id}",
                                'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url') or f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                            })
                    
                    if results:
                        # Save to cache
                        YOUTUBE_SEARCH_CACHE[normalized_query] = (results, now)
                        return Response(results)
                else:
                    print(f"[YouTube API] Error response: status_code={response.status_code} body={response.text}")
            except Exception as e:
                print(f"[YouTube API] Connection failed: {e}")

        # 4. Fallback: Local static dictionary search (fuzzy or key-based)
        print(f"[YouTube Fallback] Falling back to static mapping for: {normalized_query}")
        
        # Try direct key match
        if normalized_query in STATIC_COURSES:
            fallback_res = [STATIC_COURSES[normalized_query]]
            return Response(fallback_res)
            
        # Try partial matching
        for key, value in STATIC_COURSES.items():
            if key in normalized_query or normalized_query in key:
                return Response([value])

        # Ultimate generic fallback if no match found
        generic_fallback = [{
            'title': f'{query} Tutorial for Beginners',
            'url': f'https://www.youtube.com/results?search_query={query.replace(" ", "+")}+tutorial',
            'thumbnail': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'
        }]
        return Response(generic_fallback)
