from django.contrib import admin
from .models import ChallengeTopic, Challenge, ChallengeSubmission, AssessmentSession, AssessmentTelemetry

@admin.register(ChallengeTopic)
class ChallengeTopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'color')

@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'topic', 'challenge_type', 'xp_reward', 'created_at')
    list_filter = ('difficulty', 'challenge_type', 'topic')
    search_fields = ('title', 'description')

@admin.register(ChallengeSubmission)
class ChallengeSubmissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'challenge', 'status', 'score', 'xp_earned', 'submitted_at')
    list_filter = ('status',)

@admin.register(AssessmentSession)
class AssessmentSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'status', 'score', 'started_at')
    list_filter = ('status',)

@admin.register(AssessmentTelemetry)
class AssessmentTelemetryAdmin(admin.ModelAdmin):
    list_display = ('session', 'event_type', 'timestamp')
