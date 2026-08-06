from rest_framework import serializers
from .models import Challenge, ChallengeTopic, ChallengeSubmission


class ChallengeTopicSerializer(serializers.ModelSerializer):
    challenge_count = serializers.SerializerMethodField()

    class Meta:
        model = ChallengeTopic
        fields = ('id', 'name', 'icon', 'color', 'challenge_count')

    def get_challenge_count(self, obj):
        topic_counts = self.context.get('topic_counts')
        if topic_counts is not None and obj.id in topic_counts:
            return topic_counts[obj.id]
        return obj.challenges.filter(is_active=True).count()


class ChallengeListSerializer(serializers.ModelSerializer):
    topic = ChallengeTopicSerializer(read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = ('id', 'title', 'difficulty', 'topic', 'challenge_type',
                  'xp_reward', 'tags', 'estimated_time', 'is_active',
                  'created_at', 'is_completed')

    def get_is_completed(self, obj):
        completed_ids = self.context.get('completed_challenge_ids')
        if completed_ids is not None:
            return obj.id in completed_ids
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.submissions.filter(user=request.user, status='evaluated').exists()
        return False


class ChallengeDetailSerializer(serializers.ModelSerializer):
    topic = ChallengeTopicSerializer(read_only=True)
    is_completed = serializers.SerializerMethodField()
    user_submission = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = ('id', 'title', 'description', 'requirements', 'difficulty',
                  'topic', 'challenge_type', 'xp_reward', 'tags',
                  'estimated_time', 'created_at', 'is_completed', 'user_submission')

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.submissions.filter(user=request.user, status='evaluated').exists()
        return False

    def get_user_submission(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                sub = obj.submissions.get(user=request.user)
                return ChallengeSubmissionSerializer(sub).data
            except ChallengeSubmission.DoesNotExist:
                return None
        return None


class ChallengeSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeSubmission
        fields = ('id', 'content', 'score', 'feedback', 'status', 'xp_earned', 'submitted_at',
                  'time_complexity', 'space_complexity', 'complexity_table', 'empirical_data')
        read_only_fields = ('id', 'score', 'feedback', 'status', 'xp_earned', 'submitted_at',
                            'time_complexity', 'space_complexity', 'complexity_table', 'empirical_data')
