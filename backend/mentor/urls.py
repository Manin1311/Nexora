from django.urls import path
from .views import ConversationListView, ConversationDetailView, SendMessageView

urlpatterns = [
    path('', ConversationListView.as_view(), name='conversation-list'),
    path('<int:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('<int:conversation_id>/message/', SendMessageView.as_view(), name='send-message'),
]
