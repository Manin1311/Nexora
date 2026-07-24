from django.urls import path
from .views import GenerateRoadmapView, RoadmapDetailView, CompleteTaskView, GetTaskContentView, YoutubeResourcesView

urlpatterns = [
    path('generate/', GenerateRoadmapView.as_view(), name='roadmap-generate'),
    path('',          RoadmapDetailView.as_view(),   name='roadmap-detail'),
    path('task/<int:task_id>/complete/', CompleteTaskView.as_view(), name='roadmap-task-complete'),
    path('task/<int:task_id>/content/',  GetTaskContentView.as_view(), name='roadmap-task-content'),
    path('youtube-resources/',           YoutubeResourcesView.as_view(), name='roadmap-youtube-resources'),
]
