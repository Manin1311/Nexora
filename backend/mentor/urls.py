from django.urls import path
from .views import (
    ConversationListView, ConversationDetailView, SendMessageView,
    OpportunityMatchView, AutoUpdateRoadmapView
)

urlpatterns = [
    path('', ConversationListView.as_view(), name='conversation-list'),
    path('<int:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('<int:conversation_id>/message/', SendMessageView.as_view(), name='send-message'),
    path('opportunities/', OpportunityMatchView.as_view(), name='opportunity-match'),
    path('opportunities/add-to-roadmap/', AutoUpdateRoadmapView.as_view(), name='opportunity-add-to-roadmap'),
]
