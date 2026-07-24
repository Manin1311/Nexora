from django.urls import path
from .views import SubmitCodeReviewView, CodeReviewHistoryView, CodeReviewDetailView, CodeRefactorView

urlpatterns = [
    path('submit/',  SubmitCodeReviewView.as_view(),  name='codereview-submit'),
    path('history/', CodeReviewHistoryView.as_view(), name='codereview-history'),
    path('<int:pk>/', CodeReviewDetailView.as_view(),  name='codereview-detail'),
    path('refactor/', CodeRefactorView.as_view(),      name='codereview-refactor'),
]
