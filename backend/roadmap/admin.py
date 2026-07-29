from django.contrib import admin
from .models import LearningPath, RoadmapWeek, WeekTask

@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    list_display = ('user', 'target_role', 'is_active', 'created_at')
    list_filter = ('target_role', 'is_active')

@admin.register(RoadmapWeek)
class RoadmapWeekAdmin(admin.ModelAdmin):
    list_display = ('path', 'week_number', 'focus_area', 'is_completed')
    list_filter = ('is_completed',)

@admin.register(WeekTask)
class WeekTaskAdmin(admin.ModelAdmin):
    list_display = ('week', 'task_type', 'title', 'is_done')
    list_filter = ('task_type', 'is_done')
