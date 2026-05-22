from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    pass


class UserProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='profile'
    )
    education_level = models.CharField(max_length=150, blank=True)
    education_details = models.JSONField(default=list, blank=True)
    interests = models.TextField(blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    experience_details = models.JSONField(default=list, blank=True)
    preferred_categories = models.ManyToManyField(
        'careers.Category',
        related_name='interested_users',
        blank=True,
    )
    desired_role = models.CharField(max_length=200, blank=True)
    open_to_remote = models.BooleanField(default=True)
    location = models.CharField(max_length=150, blank=True)
    ai_summary = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.username


class UserSkillProficiency(models.Model):
    class Level(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'
        EXPERT = 'expert', 'Expert'

    class Source(models.TextChoices):
        MANUAL = 'manual', 'Added manually'
        CV = 'cv', 'Extracted from CV'
        AI = 'ai', 'Suggested by AI'

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='skill_proficiencies',
    )
    skill = models.ForeignKey(
        'careers.Skill',
        on_delete=models.CASCADE,
        related_name='user_proficiencies',
    )
    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        default=Level.BEGINNER,
    )
    source = models.CharField(
        max_length=10,
        choices=Source.choices,
        default=Source.MANUAL,
    )
    years_experience = models.FloatField(default=0)

    class Meta:
        ordering = ['skill__name']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'skill'],
                name='unique_user_skill',
            )
        ]
        verbose_name_plural = 'User Skill Proficiencies'

    def __str__(self):
        return (
            f'{self.user.username} - {self.skill.name} ({self.level})'
        )