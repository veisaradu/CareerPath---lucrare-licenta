from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    pass

class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    education_level = models.CharField(max_length=100, blank=True)
    interests = models.TextField(blank=True)
    
    def __str__(self):
        return f"Profile for {self.user.username}"