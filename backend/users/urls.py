from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, MeView, LeaderboardView, LogoutView,
    GitHubConnectView, GitHubScanView, GitHubDisconnectView,
    ResumeGetOrCreateView, ResumeAnalyzeView, ResumeAuditView, ResumePremiumUnlockView,
    ResumeTailorView,
    NotificationListView, NotificationReadAllView, NotificationReadView, NotificationClearView,
    GoogleLoginView, AIMemoryView, RecordActivityView,
)

urlpatterns = [
    path('register/',          RegisterView.as_view(),         name='register'),
    path('login/',             LoginView.as_view(),            name='login'),
    path('logout/',            LogoutView.as_view(),           name='logout'),
    path('token/refresh/',     TokenRefreshView.as_view(),     name='token_refresh'),
    path('me/',                MeView.as_view(),               name='me'),
    path('leaderboard/',       LeaderboardView.as_view(),      name='leaderboard'),
    path('github/connect/',    GitHubConnectView.as_view(),    name='github-connect'),
    path('github/disconnect/', GitHubDisconnectView.as_view(), name='github-disconnect'),
    path('github/scan/',       GitHubScanView.as_view(),       name='github-scan'),
    # Resume Suite
    path('resume/',            ResumeGetOrCreateView.as_view(), name='resume'),
    path('resume/analyze/',    ResumeAnalyzeView.as_view(),     name='resume-analyze'),
    path('resume/audit/',      ResumeAuditView.as_view(),       name='resume-audit'),
    path('resume/premium/',    ResumePremiumUnlockView.as_view(), name='resume-premium'),
    path('resume/tailor/',     ResumeTailorView.as_view(),      name='resume-tailor'),
    # Notifications
    path('notifications/',     NotificationListView.as_view(),  name='notifications-list'),
    path('notifications/read-all/', NotificationReadAllView.as_view(), name='notifications-read-all'),
    path('notifications/<int:pk>/read/', NotificationReadView.as_view(), name='notifications-read'),
    path('notifications/clear/', NotificationClearView.as_view(), name='notifications-clear'),
    # Google Login
    path('google-login/',      GoogleLoginView.as_view(),      name='google-login'),
    # AI Memory Engine
    path('memory/',            AIMemoryView.as_view(),         name='ai-memory'),
    path('memory/record/',     RecordActivityView.as_view(),   name='ai-memory-record'),
]
