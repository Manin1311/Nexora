from django.contrib import admin
from .models import InterviewSession, InterviewQuestion

@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'mode', 'difficulty', 'status', 'score', 'started_at')
    list_filter = ('mode', 'difficulty', 'status')
    search_fields = ('user__email',)

@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ('session', 'question_text', 'score', 'order')
