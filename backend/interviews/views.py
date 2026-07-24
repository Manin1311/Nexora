from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import InterviewSession, InterviewQuestion
from .serializers import InterviewSessionSerializer, InterviewSessionListSerializer, InterviewQuestionSerializer
from core.gemini_client import generate_interview_questions, evaluate_interview_answer
from progress.utils import award_xp, log_activity


class StartInterviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        mode = request.data.get('mode', 'technical')
        difficulty = request.data.get('difficulty', 'mid')
        topic = request.data.get('topic', '')
        total_questions = min(int(request.data.get('total_questions', 5)), 10)

        session = InterviewSession.objects.create(
            user=request.user,
            mode=mode,
            difficulty=difficulty,
            topic=topic,
            total_questions=total_questions
        )

        # Load resume context for personalised questions (optional — gracefully degrades)
        resume_context = None
        try:
            from users.models import Resume
            resume_context = Resume.objects.get(user=request.user)
        except Exception:
            pass

        # Generate questions via AI (resume-personalized if resume exists)
        questions_data = generate_interview_questions(mode, difficulty, topic, total_questions, resume_context=resume_context)

        for i, q in enumerate(questions_data[:total_questions]):
            InterviewQuestion.objects.create(
                session=session,
                question_text=q.get('question', f'Question {i+1}'),
                order=i + 1
            )

        return Response(InterviewSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class SubmitAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id, question_id):
        try:
            session = InterviewSession.objects.get(pk=session_id, user=request.user, status='active')
            question = InterviewQuestion.objects.get(pk=question_id, session=session)
        except (InterviewSession.DoesNotExist, InterviewQuestion.DoesNotExist):
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        answer = request.data.get('answer', '').strip()
        if not answer:
            return Response({'error': 'Answer is required.'}, status=status.HTTP_400_BAD_REQUEST)

        image_frame = request.data.get('image_frame', None)
        filler_words_count = int(request.data.get('filler_words_count', 0))
        speaking_pace = int(request.data.get('speaking_pace', 0))

        if session.mode == 'boardroom':
            from core.gemini_client import generate_boardroom_debate
            import json as pyjson
            
            # Fetch history
            history = []
            previous_questions = InterviewQuestion.objects.filter(session=session, answered_at__isnull=False).order_by('order')
            for pq in previous_questions:
                history.append({
                    "question": pq.question_text,
                    "answer": pq.user_answer
                })
            
            # Find next question text
            next_question_obj = InterviewQuestion.objects.filter(session=session, order=question.order + 1).first()
            next_question_text = next_question_obj.question_text if next_question_obj else None
            
            debate_result = generate_boardroom_debate(question.question_text, answer, history, next_question_text)
            
            question.user_answer = answer
            question.ai_feedback = debate_result.get('next_question_intro', '')
            question.score = debate_result.get('score', 7)
            question.filler_words_count = filler_words_count
            question.speaking_pace = speaking_pace
            question.eye_contact_score = 95
            question.posture_score = 95
            question.behavioral_feedback = pyjson.dumps({
                "debate_transcript": debate_result.get('debate_transcript'),
                "tech_lead_feedback": debate_result.get('tech_lead_feedback'),
                "architect_feedback": debate_result.get('architect_feedback'),
                "hr_feedback": debate_result.get('hr_feedback'),
                "next_speaker": debate_result.get('next_speaker'),
                "next_question_intro": debate_result.get('next_question_intro'),
            })
            question.answered_at = timezone.now()
            question.save()
        else:
            result = evaluate_interview_answer(question.question_text, answer, session.mode, image_frame=image_frame)

            question.user_answer = answer
            question.ai_feedback = result.get('feedback', '')
            question.score = result.get('score', 7)
            question.filler_words_count = filler_words_count
            question.speaking_pace = speaking_pace
            question.eye_contact_score = result.get('eye_contact_score', 100)
            question.posture_score = result.get('posture_score', 100)
            question.behavioral_feedback = result.get('behavioral_feedback', '')
            question.answered_at = timezone.now()
            question.save()

        return Response(InterviewQuestionSerializer(question).data)


class CompleteInterviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = InterviewSession.objects.get(pk=session_id, user=request.user, status='active')
        except InterviewSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        questions = session.questions.filter(score__isnull=False)
        if questions.exists():
            avg_score = sum(q.score for q in questions) / questions.count()
            session.score = round(avg_score, 1)
        else:
            session.score = 0

        xp_base = {'technical': 150, 'hr': 100, 'mixed': 120, 'rapid_fire': 80}.get(session.mode, 100)
        xp_earned = int(xp_base * (session.score / 10) if session.score else xp_base * 0.5)
        session.xp_earned = xp_earned
        session.status = 'completed'
        session.completed_at = timezone.now()
        session.save()

        award_xp(request.user, xp_earned)
        log_activity(request.user, 'interview_completed',
                     f'Completed {session.mode} interview — Score: {session.score}/10',
                     xp_earned, {'session_id': session.id})

        return Response(InterviewSessionSerializer(session).data)


class InterviewSessionListView(generics.ListAPIView):
    serializer_class = InterviewSessionListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InterviewSession.objects.filter(user=self.request.user).order_by('-started_at')


class InterviewSessionDetailView(generics.RetrieveAPIView):
    serializer_class = InterviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InterviewSession.objects.filter(user=self.request.user)


class RevisionGuideView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.query_params.get('company', 'Google').strip()
        role = request.query_params.get('role', 'Software Engineer').strip()
        user = request.user
        
        # 1. Fetch resume skills
        resume_skills = []
        try:
            resume = user.resume
            for sg in resume.skills:
                resume_skills.extend(sg.get('items', []))
        except Exception:
            pass
            
        # 2. Fetch past failed mock questions (scores < 6.0)
        from .models import InterviewQuestion
        failed_qs = list(
            InterviewQuestion.objects.filter(
                session__user=user,
                score__lt=6.0
            ).values_list('question_text', flat=True)[:10]
        )
        
        # 3. Identify weak topics from challenges
        from challenges.models import ChallengeSubmission
        weak_topics = list(
            ChallengeSubmission.objects.filter(
                user=user,
                score__lt=70
            ).values_list('challenge__topic__name', flat=True).distinct()[:5]
        )
        
        # 4. Generate with Gemini Client
        from core.gemini_client import compile_revision_guide
        guide = compile_revision_guide(company, role, resume_skills, weak_topics, failed_qs)
        
        return Response(guide)
