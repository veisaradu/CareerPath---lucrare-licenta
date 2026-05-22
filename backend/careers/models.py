from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

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

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Job(models.Model):
    class JobType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full Time'
        PART_TIME = 'part_time', 'Part Time'
        INTERNSHIP = 'internship', 'Internship'
        FREELANCE = 'freelance', 'Freelance'

    class ExperienceLevel(models.TextChoices):
        ENTRY = 'entry', 'Entry Level'
        MID = 'mid', 'Mid Level'
        SENIOR = 'senior', 'Senior'

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='jobs',
    )
    required_skills = models.ManyToManyField(
        Skill, related_name='required_by_jobs', blank=True
    )
    preferred_skills = models.ManyToManyField(
        Skill, related_name='preferred_by_jobs', blank=True
    )
    job_type = models.CharField(
        max_length=20,
        choices=JobType.choices,
        default=JobType.FULL_TIME,
    )
    experience_level = models.CharField(
        max_length=20,
        choices=ExperienceLevel.choices,
        default=ExperienceLevel.ENTRY,
    )
    location = models.CharField(max_length=150, blank=True)
    is_remote = models.BooleanField(default=False)
    company_name = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class CV(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cvs',
    )
    file = models.FileField(upload_to='cv_uploads/')
    extracted_text = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    extracted_skills_json = models.JSONField(null=True, blank=True)
    extracted_experience_json = models.JSONField(
        null=True,
        blank=True,
        help_text='[{"role": "...", "company": "...", "duration": "..."}]', 
    )
    extracted_education_json = models.JSONField(
        null=True,
        blank=True,
    )
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    ml_model_version = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(
        default=True,
        help_text='Only one active CV per user',
    )

    class Meta:
        verbose_name = 'CV'
        verbose_name_plural = 'CVs'
        ordering = ['-uploaded_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(is_active=True),
                name='one_active_cv_per_user',
            )
        ]

    def __str__(self):
        return f'{self.user.username} - {self.uploaded_at:%Y-%m-%d}'


class Recommendation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recommendations',
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    cv = models.ForeignKey(
        CV,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='The CV on which this recommendation is based',
    )
    match_score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    matched_skills_json = models.JSONField(
        default=list,
        help_text='Skills the user has that are required for this job',
    )
    skill_gap_json = models.JSONField(
        default=list,
        help_text='Required skills the user does not have',
    )
    explanation = models.TextField(
        blank=True,
        help_text='AI explanation of why this job is recommended',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-match_score']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'job', 'cv'],
                name='unique_recommendation_per_cv',
            )
        ]

    def __str__(self):
        return (
            f'{self.job.title} - {self.user.username} ({self.match_score}%)'
        )


class Roadmap(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='roadmaps',
    )
    target_job = models.ForeignKey(Job, on_delete=models.CASCADE)
    recommendation = models.ForeignKey(
        Recommendation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    steps_json = models.JSONField(
        default=list,
        help_text='[{"order": 1, "skill": "Docker", "action": "...", '
                  '"resource_url": "https://...", "estimated_hours": 20, "priority": "high"}]',
    )
    completed_steps = models.JSONField(
        default=list,
        blank=True,
        help_text='List of step "order" values marked as completed',
    )
    estimated_total_hours = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'target_job'],
                condition=models.Q(is_active=True),
                name='one_active_roadmap_per_job',
            )
        ]

    def __str__(self):
        return f'{self.user.username} -> {self.target_job.title}'


class ChatSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions',
    )
    related_job = models.ForeignKey(
        'Job',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='If the discussion is about a specific job',
    )
    related_recommendation = models.ForeignKey(
        'Recommendation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    topic = models.CharField(
        max_length=200,
        blank=True,
        help_text='Topic auto-generated from the first message',
    )
    started_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'Session #{self.pk} - {self.user.username}'


class ChatMessage(models.Model):
    class Sender(models.TextChoices):
        USER = 'user', 'User'
        AI = 'ai', 'Chatbot AI'

    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.CharField(
        max_length=10, choices=Sender.choices
    )
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.get_sender_display()} - {self.timestamp:%H:%M}'


class SystemConfiguration(models.Model):
    ai_model_name = models.CharField(
        max_length=100, default='gpt-3.5-turbo'
    )
    max_cv_size_mb = models.PositiveIntegerField(default=5)
    processing_limits_json = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'System Configuration'
        verbose_name_plural = 'System Configurations'

    def __str__(self):
        return f'Config ({self.updated_at:%Y-%m-%d})'