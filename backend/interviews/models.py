from django.db import models
from django.conf import settings


class InterviewSession(models.Model):
    MODE_CHOICES = [
        ('technical', 'Technical'),
        ('hr', 'HR'),
        ('mixed', 'Mixed'),
        ('rapid_fire', 'Rapid Fire'),
        ('boardroom', 'Boardroom'),
    ]
    DIFFICULTY_CHOICES = [
        ('junior', 'Junior'),
        ('mid', 'Mid-level'),
        ('senior', 'Senior'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interview_sessions')
    mode = models.CharField(max_length=20, choices=MODE_CHOICES)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='mid')
    topic = models.CharField(max_length=100, blank=True)
    total_questions = models.IntegerField(default=5)
    score = models.FloatField(null=True, blank=True)
    xp_earned = models.IntegerField(default=0)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    overall_feedback = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.mode} ({self.status})"


class InterviewQuestion(models.Model):
    session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    user_answer = models.TextField(blank=True)
    ai_feedback = models.TextField(blank=True)
    score = models.FloatField(null=True, blank=True)
    filler_words_count = models.IntegerField(default=0)
    speaking_pace = models.IntegerField(default=0)
    eye_contact_score = models.IntegerField(default=100)
    posture_score = models.IntegerField(default=100)
    behavioral_feedback = models.TextField(blank=True)
    order = models.IntegerField(default=1)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}"
