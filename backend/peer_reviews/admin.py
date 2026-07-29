from django.contrib import admin
from .models import PeerReviewRequest, PeerReviewComment

@admin.register(PeerReviewRequest)
class PeerReviewRequestAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'status', 'created_at')
    list_filter = ('status',)

@admin.register(PeerReviewComment)
class PeerReviewCommentAdmin(admin.ModelAdmin):
    list_display = ('request', 'author', 'created_at')
