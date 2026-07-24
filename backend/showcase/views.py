from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .models import Project, ProjectTag
from .serializers import ProjectSerializer, ProjectTagSerializer
from progress.utils import award_xp, log_activity


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    pagination_class = None

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Project.objects.select_related('user').prefetch_related('tags').order_by('-created_at')
        user_id = self.request.query_params.get('user')
        tag = self.request.query_params.get('tag')
        if user_id:
            qs = qs.filter(user_id=user_id)
        if tag:
            qs = qs.filter(tags__name=tag)
        return qs

    def perform_create(self, serializer):
        project = serializer.save(user=self.request.user)
        award_xp(self.request.user, 75)
        log_activity(self.request.user, 'project_added', f'Added project: {project.title}', 75, {'project_id': project.id})


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Project.objects.select_related('user').prefetch_related('tags')

    def get_object(self):
        obj = super().get_object()
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if obj.user != self.request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can only modify your own projects.')
        return obj


class UserProjectsView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user).prefetch_related('tags').order_by('-created_at')


class TagListView(generics.ListAPIView):
    queryset = ProjectTag.objects.all()
    serializer_class = ProjectTagSerializer
    permission_classes = [permissions.AllowAny]


from rest_framework.views import APIView
from core.gemini_client import generate_with_key_rotation

class ProjectLikeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Project.objects.all()

    def post(self, request, *args, **kwargs):
        project = self.get_object()
        user = request.user
        if project.likes.filter(id=user.id).exists():
            project.likes.remove(user)
            liked = False
        else:
            project.likes.add(user)
            liked = True
            
            # Create a notification if the project is liked by someone other than the owner
            if project.user != user:
                try:
                    from users.models import Notification
                    Notification.objects.create(
                        user=project.user,
                        title="New Project Upvote! ❤️",
                        message=f"{user.full_name or user.email} liked your project: '{project.title}'"
                    )
                except Exception:
                    pass

        return Response({
            'liked': liked,
            'likes_count': project.likes.count()
        }, status=status.HTTP_200_OK)


class ProjectCritiqueView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Project.objects.all()

    def post(self, request, *args, **kwargs):
        project = self.get_object()
        
        tags_str = ", ".join([t.name for t in project.tags.all()])
        prompt = (
            f"You are an elite silicon valley venture capitalist, product strategist, and tech architect.\n"
            f"Critique the following developer project pitch and tech stack:\n\n"
            f"Project Title: {project.title}\n"
            f"Tech Stack: {tags_str}\n"
            f"Description: {project.description}\n\n"
            f"Provide your structured critique in clean, professional markdown format using the following layout:\n"
            f"### 🎯 Market Potential & Pitch Score\n"
            f"Score (out of 10) with a brief justification.\n\n"
            f"### ⚙️ Technical Architecture Review\n"
            f"Analyze potential scaling bottlenecks, storage choices, and suggest security/performance updates for this tech stack.\n\n"
            f"### 💅 UI/UX Recommendations\n"
            f"Suggest 3 concrete visual improvements, micro-animations, or layout structure ideas.\n\n"
            f"### 🚀 Next-Level Features to Build\n"
            f"Suggest 2-3 innovative, unique features that would make this project stand out on a resume or portfolio."
        )
        
        try:
            critique = generate_with_key_rotation(prompt).text
        except Exception as e:
            critique = f"Failed to call AI model: {str(e)}"
            
        return Response({'critique': critique}, status=status.HTTP_200_OK)
