from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Achievement, UserAchievement, UserActivity, Certificate
from .serializers import (
    AchievementSerializer, UserAchievementSerializer,
    UserActivitySerializer, CertificateSerializer
)


class ProgressSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Check and award achievements retroactively on profile load
        from progress.utils import check_and_award_achievements
        check_and_award_achievements(user)

        try:
            profile = user.profile
        except Exception:
            from users.models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=user)

        RANK_THRESHOLDS = {
            'explorer': (0, 500),
            'builder': (500, 2000),
            'creator': (2000, 5000),
            'architect': (5000, 15000),
            'legend': (15000, None),
        }
        rank = profile.dev_rank
        thresholds = RANK_THRESHOLDS.get(rank, (0, 500))
        xp_in_rank = profile.total_xp - thresholds[0]
        xp_needed = (thresholds[1] - thresholds[0]) if thresholds[1] else 1
        progress_pct = min(100, int((xp_in_rank / xp_needed) * 100)) if xp_needed else 100

        return Response({
            'xp': profile.total_xp,
            'rank': profile.dev_rank,
            'streak_days': profile.streak_days,
            'rank_progress': progress_pct,
            'xp_to_next': profile.xp_for_next_rank(),
            'challenges_completed': user.submissions.filter(status='evaluated').count(),
            'interviews_completed': user.interview_sessions.filter(status='completed').count(),
            'projects_count': user.projects.count(),
            'achievements_count': user.achievements.count(),
            'certificates_count': user.certificates.count(),
        })


class ActivityTimelineView(generics.ListAPIView):
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserActivity.objects.filter(user=self.request.user).order_by('-created_at')[:50]


class AchievementsView(generics.ListAPIView):
    serializer_class = UserAchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAchievement.objects.filter(user=self.request.user).select_related('achievement')


class CertificatesView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(user=self.request.user)


from datetime import date, timedelta
from rest_framework import status
from .models import ScheduledTask
from .serializers import ScheduledTaskSerializer
from .scheduler import load_balance_schedule

class DailyScheduleSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. Run dynamic adaptive load balancing
        was_adapted = load_balance_schedule(user)
        
        # 2. Query scheduled tasks for a 7-day window (yesterday to +5 days)
        today = date.today()
        start_date = today - timedelta(days=1)
        end_date = today + timedelta(days=5)
        
        tasks = ScheduledTask.objects.filter(
            user=user,
            scheduled_date__range=[start_date, end_date]
        ).order_by('scheduled_date', '-priority')
        
        serialized = ScheduledTaskSerializer(tasks, many=True).data

        # 3. Resolve current roadmap week topic DIRECTLY (don't rely on task topic_label)
        today_topic = None
        has_roadmap = False
        try:
            from roadmap.models import LearningPath, RoadmapWeek
            path = LearningPath.objects.filter(user=user, is_active=True).order_by('-created_at').first()
            if path:
                has_roadmap = True
                start = path.created_at.date()
                days_elapsed = (today - start).days
                current_week_number = (days_elapsed // 7) + 1
                week = RoadmapWeek.objects.filter(
                    path=path, week_number=current_week_number
                ).first()
                if not week:
                    week = RoadmapWeek.objects.filter(path=path).order_by('-week_number').first()
                if week:
                    today_topic = week.focus_area
        except Exception:
            pass

        return Response({
            'adapted': was_adapted,
            'tasks': serialized,
            'today_topic': today_topic,
            'has_roadmap': has_roadmap,
        })



class CompleteScheduledTaskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            task = ScheduledTask.objects.get(pk=pk, user=request.user)
        except ScheduledTask.DoesNotExist:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        task.completed = not task.completed
        if task.completed:
            from django.utils import timezone
            task.completed_at = timezone.now()
        else:
            task.completed_at = None
        task.save()
        
        return Response(ScheduledTaskSerializer(task).data)
