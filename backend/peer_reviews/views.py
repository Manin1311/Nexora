from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import PeerReviewRequest, PeerReviewComment
from .serializers import (
    PeerReviewRequestListSerializer,
    PeerReviewRequestDetailSerializer,
    PeerReviewRequestCreateSerializer,
    PeerReviewCommentSerializer,
)


class PeerReviewListCreateView(APIView):
    """
    GET  /api/peer-reviews/        — public feed of open review requests
    POST /api/peer-reviews/        — create a new review request (auth required)
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        source = request.query_params.get('source')   # project | challenge | snippet
        author = request.query_params.get('author')   # 'me'

        qs = PeerReviewRequest.objects.all()
        if source:
            qs = qs.filter(source_type=source)
        if author == 'me' and request.user.is_authenticated:
            qs = qs.filter(author=request.user)

        serializer = PeerReviewRequestListSerializer(
            qs, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = PeerReviewRequestCreateSerializer(data=request.data)
        if serializer.is_valid():
            obj = serializer.save(author=request.user)

            # Record in AI Memory Engine
            try:
                from users.memory_service import record_module_activity
                record_module_activity(
                    request.user, "Peer Code Review",
                    f"Requested peer review: {obj.title[:60]}",
                    {"source_type": obj.source_type, "id": obj.id}
                )
            except Exception:
                pass

            detail = PeerReviewRequestDetailSerializer(obj, context={'request': request})
            return Response(detail.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PeerReviewDetailView(APIView):
    """
    GET   /api/peer-reviews/<id>/  — full detail with comments
    PATCH /api/peer-reviews/<id>/  — update status (author only)
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        obj = get_object_or_404(PeerReviewRequest, pk=pk)
        serializer = PeerReviewRequestDetailSerializer(obj, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        obj = get_object_or_404(PeerReviewRequest, pk=pk, author=request.user)
        new_status = request.data.get('status')
        if new_status in ('open', 'closed'):
            obj.status = new_status
            obj.save(update_fields=['status'])
        serializer = PeerReviewRequestDetailSerializer(obj, context={'request': request})
        return Response(serializer.data)


class PeerReviewUpvoteView(APIView):
    """POST /api/peer-reviews/<id>/upvote/ — toggle upvote on a request"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        obj = get_object_or_404(PeerReviewRequest, pk=pk)
        user = request.user
        if obj.upvotes.filter(pk=user.pk).exists():
            obj.upvotes.remove(user)
            voted = False
        else:
            obj.upvotes.add(user)
            voted = True
        return Response({'upvoted': voted, 'upvote_count': obj.upvote_count})


class PeerReviewCommentListCreateView(APIView):
    """
    GET  /api/peer-reviews/<id>/comments/  — list all comments on a request
    POST /api/peer-reviews/<id>/comments/  — add a comment (auth required)
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        obj = get_object_or_404(PeerReviewRequest, pk=pk)
        comments = obj.comments.all()
        serializer = PeerReviewCommentSerializer(
            comments, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        obj = get_object_or_404(PeerReviewRequest, pk=pk)
        serializer = PeerReviewCommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            comment = serializer.save(author=request.user, request=obj)

            # Record in AI Memory Engine
            try:
                from users.memory_service import record_module_activity
                record_module_activity(
                    request.user, "Peer Code Review",
                    f"Posted peer review comment on: {obj.title[:60]}",
                    {"request_id": obj.id, "comment_type": comment.comment_type}
                )
            except Exception:
                pass

            return Response(
                PeerReviewCommentSerializer(comment, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PeerReviewCommentUpvoteView(APIView):
    """POST /api/peer-reviews/comments/<id>/upvote/ — toggle upvote on a comment"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        comment = get_object_or_404(PeerReviewComment, pk=pk)
        user = request.user
        if comment.upvotes.filter(pk=user.pk).exists():
            comment.upvotes.remove(user)
            voted = False
        else:
            comment.upvotes.add(user)
            voted = True
        return Response({'upvoted': voted, 'upvote_count': comment.upvote_count})
