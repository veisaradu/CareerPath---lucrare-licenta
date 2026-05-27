import logging
import threading
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from .ml_client import process_cv_with_ml
from .permissions import IsAdminOrReadOnly
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
    permission_classes = [IsAdminOrReadOnly]


class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.select_related('category').all()
    serializer_class = SkillSerializer
    permission_classes = [IsAdminOrReadOnly]


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.filter(is_active=True).select_related('category')
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return JobDetailSerializer
        return JobListSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        job_type = self.request.query_params.get('job_type')
        experience_level = self.request.query_params.get('experience_level')
        is_remote = self.request.query_params.get('is_remote')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search', '').strip()

        if job_type:
            qs = qs.filter(job_type=job_type)
        if experience_level:
            qs = qs.filter(experience_level=experience_level)
        if is_remote is not None and is_remote != '':
            qs = qs.filter(is_remote=is_remote.lower() == 'true')
        if category:
            qs = qs.filter(category_id=category)
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(company_name__icontains=search)
            )

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

        thread = threading.Thread(
            target=self._process_cv_async,
            args=(cv.id, self.request.user.id),
            daemon=True,
        )
        thread.start()

    def _process_cv_async(self, cv_id: int, user_id: int):
        try:
            cv = CV.objects.get(id=cv_id)
            cv.file.open('rb')
            file_content = cv.file.read()
            cv.file.close()
            filename = cv.file.name.split('/')[-1]
            result = process_cv_with_ml(file_content, filename)
            if result:
                cv.extracted_text = result.get('extracted_text', '')
                cv.extracted_skills_json = result.get('skills', [])
                cv.extracted_experience_json = result.get('experience', [])
                cv.extracted_education_json = result.get('education', [])
                cv.is_processed = True
                cv.processed_at = timezone.now()
                cv.ml_model_version = '1.0'
                cv.save()

                User = get_user_model()
                user = User.objects.get(id=user_id)
                generate_recommendations(user)
        except Exception as e:
            logger.error('Async CV processing failed: %s', e)

    @action(detail=True, methods=['get'], url_path='status')
    def status(self, request, pk=None):
        cv = self.get_object()
        return Response({
            'is_processed': cv.is_processed,
            'is_active': cv.is_active,
        })

    @action(detail=True, methods=['post'], url_path='generate-recommendations')
    def generate_recommendations_action(self, request, pk=None):
        cv = self.get_object()
        if not cv.is_processed:
            return Response(
                {'error': 'CV has not been processed yet.'},
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
                {'error': 'Skill gap is empty, cannot generate roadmap.'},
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

    @action(detail=True, methods=['post'], url_path='complete-step')
    def complete_step(self, request, pk=None):
        roadmap = self.get_object()
        step_order = request.data.get('step_order')
        if step_order is None:
            return Response(
                {'error': 'step_order is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        completed = set(roadmap.completed_steps or [])
        completed.add(int(step_order))
        roadmap.completed_steps = sorted(completed)
        roadmap.save(update_fields=['completed_steps'])
        return Response({'completed_steps': roadmap.completed_steps})

    @action(detail=True, methods=['post'], url_path='uncomplete-step')
    def uncomplete_step(self, request, pk=None):
        roadmap = self.get_object()
        step_order = request.data.get('step_order')
        if step_order is None:
            return Response(
                {'error': 'step_order is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        completed = set(roadmap.completed_steps or [])
        completed.discard(int(step_order))
        roadmap.completed_steps = sorted(completed)
        roadmap.save(update_fields=['completed_steps'])
        return Response({'completed_steps': roadmap.completed_steps})


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
        related_job = serializer.validated_data.get('related_job')
        kwargs = {'user': self.request.user}
        if related_job:
            kwargs['topic'] = f"About: {related_job.title}"
        serializer.save(**kwargs)

    @action(detail=True, methods=['post'], url_path='send')
    def send_message(self, request, pk=None):
        session = self.get_object()

        user_text = request.data.get('message', '').strip()
        if not user_text:
            return Response(
                {'error': 'Message cannot be empty.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ChatMessage.objects.create(
            session=session,
            sender=ChatMessage.Sender.USER,
            message=user_text,
        )

        system_content = (
            'You are a career assistant on the CareerPath platform. '
            'Help users with advice about jobs, skills, and professional development. '
            'Respond in the same language the user writes in. '
            'Be concise and practical.'
        )

        if session.related_job:
            job = session.related_job
            required = list(job.required_skills.values_list('name', flat=True))
            preferred = list(job.preferred_skills.values_list('name', flat=True))
            system_content += (
                f'\n\nThe user is asking about a specific job posting.'
                f'\nJob: {job.title}'
                f'\nCompany: {job.company_name or "Confidential"}'
                f'\nExperience level: {job.get_experience_level_display()}'
                f'\nLocation: {"Remote" if job.is_remote else job.location or "On-site"}'
                f'\nRequired skills: {", ".join(required) or "not specified"}'
                f'\nPreferred skills: {", ".join(preferred) or "none"}'
            )

        if session.related_recommendation:
            rec = session.related_recommendation
            system_content += (
                f'\n\nThe candidate\'s match score for this job is {rec.match_score}%.'
                f'\nMatched skills: {", ".join(rec.matched_skills_json or []) or "none"}'
                f'\nSkill gaps: {", ".join(rec.skill_gap_json or []) or "none"}'
                f'\nAI explanation: {rec.explanation or ""}'
            )

        history = session.messages.order_by('timestamp')
        messages = [{'role': 'system', 'content': system_content}]
        for msg in history:
            role = 'user' if msg.sender == ChatMessage.Sender.USER else 'assistant'
            messages.append({'role': role, 'content': msg.message})

        try:
            ai_text = call_groq(messages)
        except Exception as e:
            logger.error('Groq chat failed: %s', e)
            ai_text = 'Sorry, I cannot respond right now. Please try again.'

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
        qs = ChatMessage.objects.filter(
            session__user=self.request.user
        ).select_related('session')

        session_id = self.request.query_params.get('session')
        if session_id:
            qs = qs.filter(session_id=session_id)

        return qs