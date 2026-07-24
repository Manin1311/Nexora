from rest_framework import serializers
from .models import Achievement, UserAchievement, UserActivity, Certificate


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ('id', 'name', 'description', 'icon', 'xp_reward')


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ('id', 'achievement', 'earned_at')


class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ('id', 'activity_type', 'description', 'xp_earned', 'metadata', 'created_at')


class CertificateSerializer(serializers.ModelSerializer):
    challenge_title      = serializers.SerializerMethodField()
    challenge_difficulty = serializers.SerializerMethodField()

    def get_challenge_title(self, obj):
        return obj.challenge.title if obj.challenge else None

    def get_challenge_difficulty(self, obj):
        return obj.challenge.difficulty if obj.challenge else None

    class Meta:
        model = Certificate
        fields = ('id', 'title', 'description', 'issued_at', 'certificate_id', 'challenge_title', 'challenge_difficulty')


from .models import ScheduledTask

class ScheduledTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledTask
        fields = (
            'id', 'task_type', 'title', 'description',
            'scheduled_date', 'priority', 'completed',
            'target_url', 'topic_label', 'roadmap_week',
        )
