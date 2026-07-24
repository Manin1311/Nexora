from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import MentorConversation, MentorMessage
from .serializers import MentorConversationSerializer, MentorConversationListSerializer, MentorMessageSerializer
from core.gemini_client import get_mentor_response


class ConversationListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return MentorConversationListSerializer
        return MentorConversationSerializer

    def get_queryset(self):
        return MentorConversation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = MentorConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MentorConversation.objects.filter(user=self.request.user)


class SendMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conversation = MentorConversation.objects.get(pk=conversation_id, user=request.user)
        except MentorConversation.DoesNotExist:
            return Response({'error': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save user message
        MentorMessage.objects.create(conversation=conversation, role='user', content=user_message)

        # Build user context from profile
        user = request.user
        try:
            profile = user.profile
            user_context = {
                'name': user.full_name,
                'rank': profile.dev_rank,
                'xp': profile.total_xp,
                'streak_days': profile.streak_days,
                'challenges_completed': user.submissions.filter(status='evaluated').count(),
                'recent_activity': user.activities.first().description if user.activities.exists() else 'Just getting started',
            }
        except Exception:
            user_context = {'name': user.full_name or 'Developer', 'rank': 'explorer', 'xp': 0, 'streak_days': 0, 'challenges_completed': 0, 'recent_activity': 'Getting started'}

        # Get conversation history
        history = list(conversation.messages.values('role', 'content').order_by('-created_at')[:20])
        history.reverse()

        # Get AI response
        ai_response = get_mentor_response(user_context, history, user_message)

        # Save AI message
        ai_message = MentorMessage.objects.create(
            conversation=conversation, role='assistant', content=ai_response
        )

        # Update conversation title if first message
        if conversation.messages.count() <= 2:
            conversation.title = user_message[:60]
            conversation.save()

        return Response({
            'user_message': MentorMessageSerializer(conversation.messages.filter(role='user').last()).data,
            'ai_message': MentorMessageSerializer(ai_message).data,
        })
