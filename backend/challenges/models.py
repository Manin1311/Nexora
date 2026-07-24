from django.db import models
from django.conf import settings
import uuid



class ChallengeTopic(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=20, default='#6366f1')

    def __str__(self):
        return self.name


class Challenge(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('topic', 'Topic'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.JSONField(default=list)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    topic = models.ForeignKey(ChallengeTopic, on_delete=models.SET_NULL, null=True, related_name='challenges')
    challenge_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='topic')
    xp_reward = models.IntegerField(default=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    tags = models.JSONField(default=list)
    estimated_time = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"[{self.difficulty}] {self.title}"


class ChallengeSubmission(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('evaluated', 'Evaluated'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submissions')
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='submissions')
    content = models.TextField()
    score = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    xp_earned = models.IntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)

    # Complexity & Telemetry Analytics
    time_complexity = models.CharField(max_length=50, null=True, blank=True)
    space_complexity = models.CharField(max_length=50, null=True, blank=True)
    complexity_table = models.TextField(null=True, blank=True)
    empirical_data = models.JSONField(default=dict, blank=True, null=True)

    class Meta:
        unique_together = ('user', 'challenge')

    def __str__(self):
        return f"{self.user.email} → {self.challenge.title}"


class AssessmentSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('flagged', 'Flagged/Disqualified'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assessment_sessions')
    company = models.CharField(max_length=50)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    time_limit_seconds = models.IntegerField(default=3600)
    total_warnings = models.IntegerField(default=0)
    completed_steps = models.IntegerField(default=0)
    score = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.company} ({self.status})"


class AssessmentTelemetry(models.Model):
    session = models.ForeignKey(AssessmentSession, on_delete=models.CASCADE, related_name='telemetry_logs')
    event_type = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.session.id} - {self.event_type} at {self.timestamp}"

