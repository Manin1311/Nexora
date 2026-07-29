from django.contrib import admin
from .models import LandingReview

@admin.register(LandingReview)
class LandingReviewAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('name', 'role', 'text')
