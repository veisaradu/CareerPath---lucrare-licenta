from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    UserViewSet,
    UserProfileViewSet,
    UserSkillProficiencyViewSet,
    RegisterView,
)

router = DefaultRouter()
router.register(r'accounts', UserViewSet, basename='user')
router.register(
    r'profiles', UserProfileViewSet, basename='userprofile'
)
router.register(
    r'skill-proficiencies',
    UserSkillProficiencyViewSet,
    basename='userskillproficiency',
)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path(
        'token/',
        TokenObtainPairView.as_view(),
        name='token_obtain',
    ),
    path(
        'token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh',
    ),
    path(
        'token/verify/',
        TokenVerifyView.as_view(),
        name='token_verify',
    ),
]