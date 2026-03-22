from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    SkillViewSet,
    JobViewSet,
    CVViewSet,
    RecommendationViewSet,
    RoadmapViewSet,
    ChatSessionViewSet,
    ChatMessageViewSet,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'skills', SkillViewSet)
router.register(r'jobs', JobViewSet)
router.register(r'cvs', CVViewSet, basename='cv')
router.register(
    r'recommendations',
    RecommendationViewSet,
    basename='recommendation',
)
router.register(r'roadmaps', RoadmapViewSet, basename='roadmap')
router.register(
    r'chats', ChatSessionViewSet, basename='chatsession'
)
router.register(
    r'messages', ChatMessageViewSet, basename='chatmessage'
)

urlpatterns = [
    path('', include(router.urls)),
]