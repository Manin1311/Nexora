from django.db import models
from django.conf import settings


class Achievement(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='trophy')
    xp_reward = models.IntegerField(default=50)
    criteria = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement')

    def __str__(self):
        return f"{self.user.email} earned {self.achievement.name}"


class UserActivity(models.Model):
    ACTIVITY_TYPES = [
        ('challenge_completed', 'Challenge Completed'),
        ('interview_completed', 'Interview Completed'),
        ('project_added', 'Project Added'),
        ('rank_up', 'Rank Up'),
        ('achievement_earned', 'Achievement Earned'),
        ('streak_milestone', 'Streak Milestone'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    description = models.CharField(max_length=255)
    xp_earned = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.activity_type}"


class Certificate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    challenge = models.ForeignKey('challenges.Challenge', null=True, blank=True, on_delete=models.SET_NULL)
    issued_at = models.DateTimeField(auto_now_add=True)
    certificate_id = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ['-issued_at']

    def __str__(self):
        return f"{self.user.email} - {self.title}"


class ScheduledTask(models.Model):
    TASK_TYPES = [
        ('challenge', 'Coding Challenge'),
        ('interview', 'Mock Interview'),
        ('study', 'Study / Revision Topic'),
    ]
    PRIORITIES = [
        (3, 'High'),
        (2, 'Medium'),
        (1, 'Low'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='scheduled_tasks')
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    scheduled_date = models.DateField()
    priority = models.IntegerField(choices=PRIORITIES, default=2)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    target_url = models.CharField(max_length=255, blank=True)
    # Roadmap alignment fields
    topic_label = models.CharField(
        max_length=120, blank=True,
        help_text='Focus area from the roadmap week (e.g. React Hooks)'
    )
    roadmap_week = models.ForeignKey(
        'roadmap.RoadmapWeek',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='scheduled_tasks',
        help_text='Source roadmap week this task was derived from'
    )

    class Meta:
        ordering = ['scheduled_date', '-priority']

    def __str__(self):
        return f"{self.user.email} - {self.title} ({self.scheduled_date})"
