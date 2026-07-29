from django.contrib import admin
from .models import MentorConversation, MentorMessage

@admin.register(MentorConversation)
class MentorConversationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'created_at', 'updated_at')

@admin.register(MentorMessage)
class MentorMessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'role', 'created_at')
    list_filter = ('role',)
