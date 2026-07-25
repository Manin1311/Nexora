from rest_framework import serializers
from .models import PeerReviewRequest, PeerReviewComment


class AuthorSerializer(serializers.Serializer):
    id         = serializers.IntegerField()
    full_name  = serializers.CharField()
    email      = serializers.EmailField()
    dev_rank   = serializers.SerializerMethodField()

    def get_dev_rank(self, obj):
        try:
            return obj.profile.dev_rank
        except Exception:
            return 'explorer'


class PeerReviewCommentSerializer(serializers.ModelSerializer):
    author       = AuthorSerializer(read_only=True)
    upvote_count = serializers.ReadOnlyField()
    has_upvoted  = serializers.SerializerMethodField()

    class Meta:
        model  = PeerReviewComment
        fields = [
            'id', 'author', 'body', 'line_ref', 'comment_type',
            'upvote_count', 'has_upvoted', 'created_at',
        ]
        read_only_fields = ['id', 'author', 'upvote_count', 'has_upvoted', 'created_at']

    def get_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(pk=request.user.pk).exists()
        return False


class PeerReviewRequestListSerializer(serializers.ModelSerializer):
    author       = AuthorSerializer(read_only=True)
    upvote_count = serializers.ReadOnlyField()
    comment_count = serializers.ReadOnlyField()
    has_upvoted  = serializers.SerializerMethodField()

    class Meta:
        model  = PeerReviewRequest
        fields = [
            'id', 'author', 'title', 'description', 'source_type',
            'project_id', 'project_title', 'challenge_id', 'challenge_title',
            'language', 'github_url', 'focus_areas', 'status',
            'upvote_count', 'comment_count', 'has_upvoted', 'created_at',
        ]

    def get_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(pk=request.user.pk).exists()
        return False


class PeerReviewRequestDetailSerializer(PeerReviewRequestListSerializer):
    comments = PeerReviewCommentSerializer(many=True, read_only=True)

    class Meta(PeerReviewRequestListSerializer.Meta):
        fields = PeerReviewRequestListSerializer.Meta.fields + ['code_snippet', 'comments']


class PeerReviewRequestCreateSerializer(serializers.ModelSerializer):
    project_id   = serializers.IntegerField(required=False, allow_null=True)
    challenge_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model  = PeerReviewRequest
        fields = [
            'title', 'description', 'source_type',
            'project_id', 'project_title', 'challenge_id', 'challenge_title',
            'code_snippet', 'language', 'github_url', 'focus_areas',
        ]

    def validate_project_id(self, value):
        if value == '' or value is None:
            return None
        return value

    def validate_challenge_id(self, value):
        if value == '' or value is None:
            return None
        return value

