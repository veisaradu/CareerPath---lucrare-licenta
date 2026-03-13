from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='skills',
    )

    def __str__(self):
        return self.name


class Job(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='jobs',
    )
    required_skills = models.ManyToManyField(Skill, related_name='jobs')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class CV(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cvs',
    )
    file = models.FileField(upload_to='cv_uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    extracted_skills_json = models.JSONField(null=True, blank=True)
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'CV'
        verbose_name_plural = 'CV-uri'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.user.username} - {self.uploaded_at:%Y-%m-%d}'


class Recommendation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recommendations',
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    match_score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    skill_gap_json = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-match_score']

    def __str__(self):
        return f'{self.job.title} - {self.user.username} ({self.match_score}%)'


class Roadmap(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='roadmaps',
    )
    target_job = models.ForeignKey(Job, on_delete=models.CASCADE)
    steps_json = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} -> {self.target_job.title}'


class ChatSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions',
    )
    started_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'Sesiune #{self.pk} - {self.user.username}'


class ChatMessage(models.Model):
    SENDER_USER = 'user'
    SENDER_AI = 'ai'
    SENDER_CHOICES = [
        (SENDER_USER, 'Utilizator'),
        (SENDER_AI, 'Chatbot AI'),
    ]

    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.get_sender_display()} - {self.timestamp:%H:%M}'


class SystemConfiguration(models.Model):
    ai_model_name = models.CharField(max_length=100, default='gpt-3.5-turbo')
    max_cv_size_mb = models.PositiveIntegerField(default=5)
    processing_limits_json = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Config ({self.updated_at:%Y-%m-%d})'