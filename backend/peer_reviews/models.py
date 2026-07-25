from django.db import models
from django.conf import settings


SOURCE_CHOICES = [
    ('project',   'Showcase Project'),
    ('challenge', 'Challenge Submission'),
    ('snippet',   'Code Snippet'),
]

FOCUS_CHOICES = [
    ('security',      'Security'),
    ('performance',   'Performance'),
    ('readability',   'Readability'),
    ('architecture',  'Architecture'),
    ('testing',       'Testing'),
    ('general',       'General'),
]

COMMENT_TYPE_CHOICES = [
    ('suggestion', 'Suggestion'),
    ('issue',      'Issue'),
    ('praise',     'Praise'),
    ('question',   'Question'),
]

STATUS_CHOICES = [
    ('open',   'Open'),
    ('closed', 'Closed'),
]


class PeerReviewRequest(models.Model):
    """A developer's request for peer code review."""

    author       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='peer_review_requests',
    )
    title        = models.CharField(max_length=200)
    description  = models.TextField(blank=True, default='')

    # Source
    source_type  = models.CharField(max_length=15, choices=SOURCE_CHOICES, default='snippet')
    project_id   = models.IntegerField(null=True, blank=True)     # showcase project ID
    project_title= models.CharField(max_length=255, blank=True)
    challenge_id = models.IntegerField(null=True, blank=True)     # challenge ID
    challenge_title = models.CharField(max_length=255, blank=True)

    # Code
    code_snippet = models.TextField(blank=True, default='')
    language     = models.CharField(max_length=50, blank=True, default='')
    github_url   = models.URLField(blank=True, default='')

    # Focus areas (stored as comma-separated string for simplicity)
    focus_areas  = models.CharField(max_length=200, blank=True, default='general')

    # Status & social
    status       = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    upvotes      = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='upvoted_review_requests',
        blank=True,
    )

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.email} — {self.title[:60]}"

    @property
    def comment_count(self):
        return self.comments.count()

    @property
    def upvote_count(self):
        return self.upvotes.count()


class PeerReviewComment(models.Model):
    """A peer reviewer's feedback comment on a review request."""

    request     = models.ForeignKey(
        PeerReviewRequest,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    author      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='peer_review_comments',
    )
    body        = models.TextField()
    line_ref    = models.CharField(max_length=50, blank=True, default='')  # e.g. "L42-L58"
    comment_type = models.CharField(
        max_length=15,
        choices=COMMENT_TYPE_CHOICES,
        default='suggestion',
    )
    upvotes     = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='upvoted_review_comments',
        blank=True,
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.author.email} on '{self.request.title[:40]}'"

    @property
    def upvote_count(self):
        return self.upvotes.count()
