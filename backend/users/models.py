from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    RANK_CHOICES = [
        ('explorer', 'Explorer'),
        ('builder', 'Builder'),
        ('creator', 'Creator'),
        ('architect', 'Architect'),
        ('legend', 'Legend'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    dev_rank = models.CharField(max_length=20, choices=RANK_CHOICES, default='explorer')
    total_xp = models.IntegerField(default=0)
    streak_days = models.IntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)
    # GitHub Integration
    github_username   = models.CharField(max_length=100, blank=True)
    github_connected  = models.BooleanField(default=False)
    code_health_score = models.IntegerField(default=0)
    github_repos_json = models.JSONField(default=list, blank=True)
    github_scanned_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def update_rank(self):
        xp = self.total_xp
        if xp >= 15000:
            self.dev_rank = 'legend'
        elif xp >= 5001:
            self.dev_rank = 'architect'
        elif xp >= 2001:
            self.dev_rank = 'creator'
        elif xp >= 501:
            self.dev_rank = 'builder'
        else:
            self.dev_rank = 'explorer'
        self.save()

    def xp_for_next_rank(self):
        thresholds = [0, 500, 2000, 5000, 15000]
        xp = self.total_xp
        for t in thresholds:
            if xp < t:
                return t
        return None  # Legend, max rank

    def __str__(self):
        return f"{self.user.email} - {self.dev_rank}"


class Resume(models.Model):
    """Stores a user's complete resume data for the Nexora Resume Hub."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='resume')

    # ── Builder Sections ────────────────────────────────────────────────────
    # { name, title, email, phone, linkedin, github, website, summary }
    personal_info   = models.JSONField(default=dict, blank=True)
    # [{ company, role, location, start, end, current, bullets:[] }]
    experience      = models.JSONField(default=list, blank=True)
    # [{ name, tech_stack:[], description, url, bullets:[] }]
    projects        = models.JSONField(default=list, blank=True)
    # [{ category, items:[] }]  e.g. Languages, Frameworks, Tools, Databases
    skills          = models.JSONField(default=list, blank=True)
    # [{ institution, degree, field, year, gpa }]
    education       = models.JSONField(default=list, blank=True)
    # [{ name, issuer, year, url }]
    certifications  = models.JSONField(default=list, blank=True)
    # [{ title, items:[] }]  Extra-curricular, achievements, awards, etc.
    custom_sections = models.JSONField(default=list, blank=True)

    # ── ATS / Audit ─────────────────────────────────────────────────────────
    target_role     = models.CharField(max_length=150, blank=True)
    ats_score       = models.IntegerField(default=0)
    # { strengths:[], weaknesses:[], keyword_gaps:[], checklist:{}, tips:[] }
    audit_report    = models.JSONField(default=dict, blank=True)

    # ── Premium ─────────────────────────────────────────────────────────────
    is_premium_unlocked = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Resume — {self.user.email}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.title}"


class UserAIMemory(models.Model):
    """Persistent long-term AI memory engine profile for a user across all 10 Nexora modules."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_memory')
    skills_mastery = models.JSONField(default=dict, blank=True)
    strengths = models.JSONField(default=list, blank=True)
    weaknesses = models.JSONField(default=list, blank=True)
    recurring_mistakes = models.JSONField(default=list, blank=True)
    interview_stats = models.JSONField(default=dict, blank=True)
    career_goals = models.JSONField(default=dict, blank=True)
    learning_habits = models.JSONField(default=dict, blank=True)
    activity_log = models.JSONField(default=list, blank=True)
    ai_summary = models.TextField(blank=True, default="Developer profile initialized. AI Memory Engine is actively tracking your learning journey across all modules.")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"AI Memory — {self.user.email}"

