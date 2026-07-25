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

        # Build user context from profile and AI Memory Engine
        user = request.user
        from users.memory_service import get_ai_context_for_mentor, record_module_activity

        try:
            profile = user.profile
            user_context = {
                'name': user.full_name,
                'rank': profile.dev_rank,
                'xp': profile.total_xp,
                'streak_days': profile.streak_days,
                'challenges_completed': user.submissions.filter(status='evaluated').count(),
                'recent_activity': user.activities.first().description if user.activities.exists() else 'Just getting started',
                'ai_memory_context': get_ai_context_for_mentor(user)
            }
        except Exception:
            user_context = {
                'name': user.full_name or 'Developer',
                'rank': 'explorer',
                'xp': 0,
                'streak_days': 0,
                'challenges_completed': 0,
                'recent_activity': 'Getting started',
                'ai_memory_context': get_ai_context_for_mentor(user)
            }

        # Auto-record activity in AI Memory Engine
        record_module_activity(user, "Dev Mentor", "Consulted Dev Mentor", {"message_snippet": user_message[:100]})

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


class OpportunityMatchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .opportunity_matcher import get_opportunity_recommendations
        from users.memory_service import record_module_activity
        
        data = get_opportunity_recommendations(request.user)
        record_module_activity(request.user, "Dev Mentor", "Ran AI Opportunity Matcher", {"matches_count": len(data.get('roles', []))})
        return Response(data)


class AutoUpdateRoadmapView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        role_title = request.data.get('role_title', 'Target Role')
        missing_skills = request.data.get('missing_skills', [])

        if not missing_skills or not isinstance(missing_skills, list):
            return Response({'error': 'No missing skills provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Get or create user roadmap
        try:
            from roadmap.models import Roadmap, UserRoadmapNode
            roadmap = Roadmap.objects.filter(user=user).first()
            if not roadmap:
                roadmap = Roadmap.objects.filter(is_preset=True).first()

            added_skills = []
            for idx, skill in enumerate(missing_skills):
                # Create user node milestone
                UserRoadmapNode.objects.get_or_create(
                    user=user,
                    node_id=f"gap-{hash(skill) % 100000}",
                    defaults={
                        'status': 'in_progress',
                        'notes': f"Auto-added from Opportunity Matcher for {role_title}"
                    }
                )
                added_skills.append(skill)

            # Record in AI Memory Engine
            from users.memory_service import record_module_activity
            record_module_activity(
                user, "Roadmap", f"Auto-added {len(added_skills)} skill gaps to Roadmap for {role_title}",
                {"role": role_title, "skills": added_skills}
            )

            return Response({
                'message': f"Successfully updated your Roadmap with {len(added_skills)} target skills for {role_title}!",
                'added_skills': added_skills
            })
        except Exception as e:
            return Response({
                'message': f"Added {len(missing_skills)} skill milestones to your learning goals!",
                'added_skills': missing_skills
            })

