from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    UserProfileViewSet,
    UserSkillProficiencyViewSet,
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
]