from rest_framework import serializers
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


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class SkillSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name', read_only=True
    )

    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'category_name']


class JobListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name', read_only=True
    )

    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'company_name',
            'category',
            'category_name',
            'job_type',
            'experience_level',
            'location',
            'is_remote',
            'created_at',
        ]


class JobDetailSerializer(serializers.ModelSerializer):
    required_skills = SkillSerializer(many=True, read_only=True)
    preferred_skills = SkillSerializer(many=True, read_only=True)
    category_detail = CategorySerializer(
        source='category', read_only=True
    )

    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'description',
            'category',
            'category_detail',
            'required_skills',
            'preferred_skills',
            'job_type',
            'experience_level',
            'location',
            'is_remote',
            'company_name',
            'is_active',
            'created_at',
        ]


class CVSerializer(serializers.ModelSerializer):
    class Meta:
        model = CV
        fields = '__all__'
        read_only_fields = [
            'user',
            'extracted_text',
            'extracted_skills_json',
            'extracted_experience_json',
            'extracted_education_json',
            'is_processed',
            'processed_at',
            'ml_model_version',
        ]


class RecommendationSerializer(serializers.ModelSerializer):
    job_detail = JobListSerializer(source='job', read_only=True)
    job = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all()
    )

    class Meta:
        model = Recommendation
        fields = '__all__'
        read_only_fields = [
            'user',
            'match_score',
            'matched_skills_json',
            'skill_gap_json',
            'explanation',
            'created_at',
        ]


class RoadmapSerializer(serializers.ModelSerializer):
    target_job_detail = JobListSerializer(
        source='target_job', read_only=True
    )
    target_job = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all()
    )

    class Meta:
        model = Roadmap
        fields = '__all__'
        read_only_fields = [
            'user',
            'steps_json',
            'completed_steps',
            'estimated_total_hours',
            'created_at',
            'updated_at',
        ]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ['timestamp']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source='started_at', read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            'id',
            'user',
            'related_job',
            'related_recommendation',
            'topic',
            'created_at',
            'is_active',
            'messages',
            'message_count',
        ]
        read_only_fields = ['user']

    def get_message_count(self, obj):
        return obj.messages.count()