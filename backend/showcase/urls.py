from django.urls import path
from .views import ProjectListCreateView, ProjectDetailView, UserProjectsView, TagListView, ProjectLikeView, ProjectCritiqueView

urlpatterns = [
    path('', ProjectListCreateView.as_view(), name='project-list'),
    path('my/', UserProjectsView.as_view(), name='my-projects'),
    path('tags/', TagListView.as_view(), name='tag-list'),
    path('<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('<int:pk>/like/', ProjectLikeView.as_view(), name='project-like'),
    path('<int:pk>/critique/', ProjectCritiqueView.as_view(), name='project-critique'),
]
