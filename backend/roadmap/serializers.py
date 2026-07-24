from rest_framework import serializers
from .models import LearningPath, RoadmapWeek, WeekTask


class WeekTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeekTask
        fields = ('id', 'task_type', 'title', 'description',
                  'challenge_id', 'interview_mode', 'interview_difficulty',
                  'is_done', 'done_at', 'order')


class RoadmapWeekSerializer(serializers.ModelSerializer):
    tasks = WeekTaskSerializer(many=True, read_only=True)
    completed_tasks = serializers.SerializerMethodField()
    total_tasks     = serializers.SerializerMethodField()

    def get_completed_tasks(self, obj):
        return obj.tasks.filter(is_done=True).count()

    def get_total_tasks(self, obj):
        return obj.tasks.count()

    class Meta:
        model = RoadmapWeek
        fields = ('id', 'week_number', 'focus_area', 'weakness_reason',
                  'xp_goal', 'is_completed', 'tasks', 'completed_tasks', 'total_tasks')


class LearningPathSerializer(serializers.ModelSerializer):
    weeks = RoadmapWeekSerializer(many=True, read_only=True)
    total_weeks      = serializers.SerializerMethodField()
    completed_weeks  = serializers.SerializerMethodField()

    def get_total_weeks(self, obj):
        return obj.weeks.count()

    def get_completed_weeks(self, obj):
        return obj.weeks.filter(is_completed=True).count()

    class Meta:
        model = LearningPath
        fields = ('id', 'target_role', 'summary', 'is_active',
                  'created_at', 'weeks', 'total_weeks', 'completed_weeks')
