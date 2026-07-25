from django.contrib import admin
from .models import PeerReviewRequest, PeerReviewComment


@admin.register(PeerReviewRequest)
class PeerReviewRequestAdmin(admin.ModelAdmin):
    list_display  = ('title', 'author', 'source_type', 'status', 'upvote_count', 'comment_count', 'created_at')
    list_filter   = ('source_type', 'status')
    search_fields = ('title', 'author__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PeerReviewComment)
class PeerReviewCommentAdmin(admin.ModelAdmin):
    list_display  = ('author', 'request', 'comment_type', 'upvote_count', 'created_at')
    list_filter   = ('comment_type',)
    search_fields = ('author__email', 'body')
