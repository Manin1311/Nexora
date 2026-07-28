from django.db import models


class LandingReview(models.Model):
    name       = models.CharField(max_length=100)
    role       = models.CharField(max_length=150, blank=True, default='Software Developer')
    text       = models.TextField()
    rating     = models.PositiveSmallIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.rating}★)"
