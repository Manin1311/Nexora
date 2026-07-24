from django.urls import path
from .views import (
    StartInterviewView, SubmitAnswerView, CompleteInterviewView,
    InterviewSessionListView, InterviewSessionDetailView, RevisionGuideView
)

urlpatterns = [
    path('', InterviewSessionListView.as_view(), name='interview-list'),
    path('start/', StartInterviewView.as_view(), name='interview-start'),
    path('revision/', RevisionGuideView.as_view(), name='interview-revision'),
    path('<int:pk>/', InterviewSessionDetailView.as_view(), name='interview-detail'),
    path('<int:session_id>/complete/', CompleteInterviewView.as_view(), name='interview-complete'),
    path('<int:session_id>/answer/<int:question_id>/', SubmitAnswerView.as_view(), name='interview-answer'),
]
