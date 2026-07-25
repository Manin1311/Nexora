from django.urls import path
from .views import (
    PeerReviewListCreateView,
    PeerReviewDetailView,
    PeerReviewUpvoteView,
    PeerReviewCommentListCreateView,
    PeerReviewCommentUpvoteView,
)

urlpatterns = [
    path('',                            PeerReviewListCreateView.as_view(),    name='peer-review-list'),
    path('<int:pk>/',                   PeerReviewDetailView.as_view(),        name='peer-review-detail'),
    path('<int:pk>/upvote/',            PeerReviewUpvoteView.as_view(),        name='peer-review-upvote'),
    path('<int:pk>/comments/',          PeerReviewCommentListCreateView.as_view(), name='peer-review-comments'),
    path('comments/<int:pk>/upvote/',   PeerReviewCommentUpvoteView.as_view(), name='peer-review-comment-upvote'),
]
