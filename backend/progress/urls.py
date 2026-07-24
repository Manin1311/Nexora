from django.urls import path
from .views import (
    ProgressSummaryView, ActivityTimelineView, AchievementsView, CertificatesView,
    DailyScheduleSyncView, CompleteScheduledTaskView
)

urlpatterns = [
    path('summary/', ProgressSummaryView.as_view(), name='progress-summary'),
    path('activity/', ActivityTimelineView.as_view(), name='activity-timeline'),
    path('achievements/', AchievementsView.as_view(), name='achievements'),
    path('certificates/', CertificatesView.as_view(), name='certificates'),
    path('schedule/sync/', DailyScheduleSyncView.as_view(), name='schedule-sync'),
    path('schedule/complete/<int:pk>/', CompleteScheduledTaskView.as_view(), name='schedule-complete'),
]
