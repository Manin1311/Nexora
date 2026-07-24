from rest_framework import serializers
from .models import MentorConversation, MentorMessage


class MentorMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorMessage
        fields = ('id', 'role', 'content', 'created_at')
        read_only_fields = ('id', 'role', 'created_at')


class MentorConversationSerializer(serializers.ModelSerializer):
    messages = MentorMessageSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = MentorConversation
        fields = ('id', 'title', 'created_at', 'updated_at', 'messages', 'last_message')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return msg.content[:80] if msg else None


class MentorConversationListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = MentorConversation
        fields = ('id', 'title', 'updated_at', 'last_message')

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return msg.content[:80] if msg else None
