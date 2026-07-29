from django.contrib import admin
from .models import CodeReview

@admin.register(CodeReview)
class CodeReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'repo_name', 'status', 'overall_score')
    list_filter = ('status',)
