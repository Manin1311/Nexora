from django.contrib import admin
from .models import ProjectTag, Project

@admin.register(ProjectTag)
class ProjectTagAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'is_featured', 'created_at')
    list_filter = ('is_featured',)
