from rest_framework import viewsets, mixins, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import UserProfile, UserSkillProficiency
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    UserSkillProficiencySerializer,
    RegisterSerializer,
)
from .throttles import LoginRateThrottle

User = get_user_model()


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return (
                User.objects.select_related('profile')
                .prefetch_related('skill_proficiencies__skill__category')
                .all()
            )
        return (
            User.objects.filter(pk=self.request.user.pk)
            .select_related('profile')
            .prefetch_related('skill_proficiencies__skill__category')
        )

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        UserProfile.objects.get_or_create(user=request.user)
        user = (
            User.objects.filter(pk=request.user.pk)
            .select_related('profile')
            .prefetch_related('skill_proficiencies__skill__category')
            .first()
        )
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class UserProfileViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            UserProfile.objects.filter(user=self.request.user)
            .select_related('user')
            .prefetch_related('preferred_categories')
        )

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if request.method == 'PATCH':
            serializer = self.get_serializer(
                profile, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class UserSkillProficiencyViewSet(viewsets.ModelViewSet):
    serializer_class = UserSkillProficiencySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserSkillProficiency.objects.filter(
            user=self.request.user
        ).select_related('user', 'skill__category')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'detail': 'Account created. You can now log in.'},
            status=status.HTTP_201_CREATED,
        )