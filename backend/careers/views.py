from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import (
    Category,
    Skill,
    Job,
    CV,
    Recommendation,
    Roadmap,
    ChatSession,
    ChatMessage,
)
from .serializers import (
    CategorySerializer,
    SkillSerializer,
    JobListSerializer,
    JobDetailSerializer,
    CVSerializer,
    RecommendationSerializer,
    RoadmapSerializer,
    ChatSessionSerializer,
    ChatMessageSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.select_related('category').all()
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.filter(is_active=True).select_related(
        'category'
    )
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return JobDetailSerializer
        return JobListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'retrieve':
            qs = qs.prefetch_related(
                'required_skills__category',
                'preferred_skills__category',
            )
        return qs


class CVViewSet(viewsets.ModelViewSet):
    serializer_class = CVSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            CV.objects.filter(user=self.request.user)
            .select_related('user')
            .all()
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecommendationViewSet(viewsets.ModelViewSet):
    serializer_class = RecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Recommendation.objects.filter(user=self.request.user)
            .select_related('user', 'job__category', 'cv')
            .all()
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RoadmapViewSet(viewsets.ModelViewSet):
    serializer_class = RoadmapSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Roadmap.objects.filter(user=self.request.user)
            .select_related(
                'user', 'target_job__category', 'recommendation'
            )
            .all()
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            ChatSession.objects.filter(user=self.request.user)
            .select_related(
                'user', 'related_job', 'related_recommendation'
            )
            .prefetch_related('messages')
            .all()
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            ChatMessage.objects.filter(
                session__user=self.request.user
            )
            .select_related('session')
            .all()
        )