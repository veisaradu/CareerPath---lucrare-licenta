from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import UserProfile, UserSkillProficiency
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    UserSkillProficiencySerializer,
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return (
                User.objects.select_related('profile')
                .prefetch_related(
                    'skill_proficiencies__skill__category'
                )
                .all()
            )
        return (
            User.objects.filter(pk=self.request.user.pk)
            .select_related('profile')
            .prefetch_related(
                'skill_proficiencies__skill__category'
            )
        )


class UserProfileViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Profilul există deja (creat la register via signal).
    Userul doar citește și editează.
    GET    /api/users/profiles/{id}/
    PATCH  /api/users/profiles/{id}/
    """

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            UserProfile.objects.filter(user=self.request.user)
            .select_related('user')
            .prefetch_related('preferred_categories')
        )


class UserSkillProficiencyViewSet(viewsets.ModelViewSet):
    serializer_class = UserSkillProficiencySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserSkillProficiency.objects.filter(
            user=self.request.user
        ).select_related('user', 'skill__category')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)