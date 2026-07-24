from django.db import models
from django.conf import settings


class LearningPath(models.Model):
    TARGET_ROLES = [
        ('faang_swe',    'FAANG Software Engineer'),
        ('frontend_dev', 'Frontend Developer'),
        ('backend_dev',  'Backend Developer'),
        ('fullstack_dev','Full Stack Developer'),
        ('devops',       'DevOps Engineer'),
        ('ml_engineer',  'ML/AI Engineer'),
        ('product',      'Product Manager (Tech)'),
    ]

    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='roadmaps')
    target_role = models.CharField(max_length=50, choices=TARGET_ROLES, default='fullstack_dev')
    summary     = models.TextField(blank=True, help_text='AI-generated roadmap overview')
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} → {self.target_role}"


class RoadmapWeek(models.Model):
    path          = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='weeks')
    week_number   = models.IntegerField()
    focus_area    = models.CharField(max_length=100)
    weakness_reason = models.TextField(blank=True)
    xp_goal       = models.IntegerField(default=300)
    is_completed  = models.BooleanField(default=False)

    class Meta:
        ordering = ['week_number']

    def __str__(self):
        return f"Week {self.week_number}: {self.focus_area}"


class WeekTask(models.Model):
    TASK_TYPES = [
        ('challenge', 'Challenge'),
        ('interview', 'Interview Session'),
        ('study',     'Study Topic'),
    ]

    week        = models.ForeignKey(RoadmapWeek, on_delete=models.CASCADE, related_name='tasks')
    task_type   = models.CharField(max_length=15, choices=TASK_TYPES)
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    # Optional direct links to existing content
    challenge_id   = models.IntegerField(null=True, blank=True)  # challenges.Challenge id
    interview_mode = models.CharField(max_length=20, blank=True) # 'technical', 'hr', etc.
    interview_difficulty = models.CharField(max_length=20, blank=True)
    is_done     = models.BooleanField(default=False)
    done_at     = models.DateTimeField(null=True, blank=True)
    order       = models.IntegerField(default=1)
    cached_content = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"[{self.task_type}] {self.title}"
