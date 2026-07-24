from rest_framework import serializers
from .models import InterviewSession, InterviewQuestion


class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = (
            'id', 'question_text', 'user_answer', 'ai_feedback', 'score', 'order', 'answered_at',
            'filler_words_count', 'speaking_pace', 'eye_contact_score', 'posture_score', 'behavioral_feedback'
        )
        read_only_fields = ('id', 'question_text', 'ai_feedback', 'score', 'answered_at')


class InterviewSessionSerializer(serializers.ModelSerializer):
    questions = InterviewQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = InterviewSession
        fields = ('id', 'mode', 'difficulty', 'topic', 'total_questions', 'score',
                  'xp_earned', 'status', 'started_at', 'completed_at', 'overall_feedback', 'questions')
        read_only_fields = ('id', 'score', 'xp_earned', 'status', 'started_at', 'completed_at', 'overall_feedback')


class InterviewSessionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSession
        fields = ('id', 'mode', 'difficulty', 'topic', 'total_questions', 'score',
                  'xp_earned', 'status', 'started_at', 'completed_at')
