from django.contrib import admin
from .models import Achievement, UserAchievement, UserActivity, Certificate, ScheduledTask

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'xp_reward', 'created_at')

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'earned_at')

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity_type', 'xp_earned', 'created_at')
    list_filter = ('activity_type',)

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_id', 'user', 'title', 'issued_at')

@admin.register(ScheduledTask)
class ScheduledTaskAdmin(admin.ModelAdmin):
    list_display = ('user', 'task_type', 'title', 'scheduled_date', 'completed')
    list_filter = ('task_type', 'completed')
