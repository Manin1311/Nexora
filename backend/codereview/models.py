from django.db import models
from django.conf import settings


class CodeReview(models.Model):
    """Stores a cached AI code review result for a GitHub repository."""

    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('completed', 'Completed'),
        ('failed',    'Failed'),
    ]

    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='code_reviews',
    )
    repo_url    = models.URLField(max_length=500)
    repo_owner  = models.CharField(max_length=150)
    repo_name   = models.CharField(max_length=150)
    status      = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')

    # Aggregated results
    overall_score   = models.IntegerField(null=True, blank=True)
    total_issues    = models.IntegerField(default=0)
    critical_count  = models.IntegerField(default=0)
    high_count      = models.IntegerField(default=0)
    medium_count    = models.IntegerField(default=0)
    low_count       = models.IntegerField(default=0)

    # Full structured report stored as JSON
    report_json     = models.JSONField(null=True, blank=True)

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} → {self.repo_owner}/{self.repo_name} ({self.status})"
