import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from .ml_client import process_cv_with_ml
from .recommendation_service import generate_recommendations
from .roadmap_service import generate_roadmap
from .ai_service import call_groq
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

logger = logging.getLogger(__name__)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.select_related('category').all()
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.filter(is_active=True).select_related('category')
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
        CV.objects.filter(
            user=self.request.user, is_active=True
        ).update(is_active=False)

        cv = serializer.save(user=self.request.user, is_active=True)

        result = process_cv_with_ml(cv.file.path)
        if result:
            cv.extracted_text = result.get('extracted_text', '')
            cv.extracted_skills_json = result.get('skills', [])
            cv.extracted_experience_json = result.get('experience', [])
            cv.extracted_education_json = result.get('education', [])
            cv.is_processed = True
            cv.processed_at = timezone.now()
            cv.ml_model_version = '1.0'
            cv.save()

            try:
                generate_recommendations(self.request.user)
            except Exception as e:
                logger.error('Auto recommendation generation failed: %s', e)

    @action(detail=True, methods=['post'], url_path='generate-recommendations')
    def generate_recommendations_action(self, request, pk=None):
        cv = self.get_object()
        if not cv.is_processed:
            return Response(
                {'error': 'CV-ul nu a fost procesat inca.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        recs = generate_recommendations(request.user)
        return Response({'generated': len(recs)})


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

    @action(detail=True, methods=['post'], url_path='generate-roadmap')
    def generate_roadmap_action(self, request, pk=None):
        rec = self.get_object()
        roadmap = generate_roadmap(request.user, rec)
        if not roadmap:
            return Response(
                {'error': 'Skill gap gol, nu se poate genera roadmap.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(RoadmapSerializer(roadmap).data)


class RoadmapViewSet(viewsets.ModelViewSet):
    serializer_class = RoadmapSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Roadmap.objects.filter(user=self.request.user)
            .select_related('user', 'target_job__category', 'recommendation')
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
            .select_related('user', 'related_job', 'related_recommendation')
            .prefetch_related('messages')
            .all()
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='send')
    def send_message(self, request, pk=None):
        session = self.get_object()

        user_text = request.data.get('message', '').strip()
        if not user_text:
            return Response(
                {'error': 'Mesajul nu poate fi gol.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ChatMessage.objects.create(
            session=session,
            sender=ChatMessage.Sender.USER,
            message=user_text,
        )

        history = session.messages.order_by('timestamp')
        messages = [
            {
                'role': 'system',
                'content': (
                    'Esti un asistent de cariera pe platforma CareerPath. '
                    'Ajuti utilizatorii cu sfaturi despre joburi, skilluri și '
                    'dezvoltare profesionala. Raspunde in limba in care ti se scrie. '
                    'Fii concis si practic.'
                ),
            }
        ]
        for msg in history:
            role = (
                'user'
                if msg.sender == ChatMessage.Sender.USER
                else 'assistant'
            )
            messages.append({'role': role, 'content': msg.message})

        try:
            ai_text = call_groq(messages)
        except Exception as e:
            logger.error('Groq chat failed: %s', e)
            ai_text = 'Imi pare rau, nu pot raspunde momentan. Incearca din nou.'

        ai_msg = ChatMessage.objects.create(
            session=session,
            sender=ChatMessage.Sender.AI,
            message=ai_text,
        )

        if not session.topic:
            session.topic = user_text[:100]
            session.save(update_fields=['topic'])

        return Response(ChatMessageSerializer(ai_msg).data)


class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            ChatMessage.objects.filter(session__user=self.request.user)
            .select_related('session')
            .all()
        )