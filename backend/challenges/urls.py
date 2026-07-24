from django.urls import path
from .views import (
    ChallengeListView, ChallengeDetailView, SubmitChallengeView,
    ChallengeTopicListView, DailyChallengeView, GenerateAIChallengeView,
    UserActivityGridView, GenerateChallengeFromTaskView,
    StartAssessmentView, LogTelemetryView, SubmitAssessmentCodeView, FinishAssessmentView,
    ActiveAssessmentView
)

urlpatterns = [
    path('', ChallengeListView.as_view(), name='challenge-list'),
    path('topics/', ChallengeTopicListView.as_view(), name='challenge-topics'),
    path('daily/', DailyChallengeView.as_view(), name='daily-challenge'),
    path('generate-ai/', GenerateAIChallengeView.as_view(), name='challenge-generate-ai'),
    path('activity/', UserActivityGridView.as_view(), name='user-activity-grid'),
    path('assessment/start/', StartAssessmentView.as_view(), name='assessment-start'),
    path('assessment/active/', ActiveAssessmentView.as_view(), name='assessment-active'),
    path('assessment/telemetry/', LogTelemetryView.as_view(), name='assessment-telemetry'),
    path('assessment/submit/', SubmitAssessmentCodeView.as_view(), name='assessment-submit'),
    path('assessment/finish/', FinishAssessmentView.as_view(), name='assessment-finish'),
    path('generate-from-task/', GenerateChallengeFromTaskView.as_view(), name='challenge-generate-from-task'),
    path('<int:pk>/', ChallengeDetailView.as_view(), name='challenge-detail'),
    path('<int:pk>/submit/', SubmitChallengeView.as_view(), name='challenge-submit'),
]

