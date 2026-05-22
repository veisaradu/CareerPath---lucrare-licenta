from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    UserViewSet,
    UserProfileViewSet,
    UserSkillProficiencyViewSet,
    RegisterView,
    ThrottledTokenObtainPairView,
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
        ThrottledTokenObtainPairView.as_view(),
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