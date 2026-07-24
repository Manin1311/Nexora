from django.db import models
from django.conf import settings


class ProjectTag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Project(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    image = models.ImageField(upload_to='projects/', null=True, blank=True)
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    tags = models.ManyToManyField(ProjectTag, blank=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_projects', blank=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.title}"
