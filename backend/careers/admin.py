from django.contrib import admin
from .models import (
    Category,
    Skill,
    Job,
    CV,
    Recommendation,
    Roadmap,
    ChatSession,
    ChatMessage,
    SystemConfiguration,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    list_filter = ('category',)
    search_fields = ('name',)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'company_name',
        'category',
        'job_type',
        'experience_level',
        'is_remote',
        'is_active',
    )
    list_filter = (
        'is_active',
        'job_type',
        'experience_level',
        'is_remote',
        'category',
    )
    search_fields = ('title', 'description', 'company_name')
    filter_horizontal = ('required_skills', 'preferred_skills')


@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'uploaded_at',
        'is_processed',
        'is_active',
        'processed_at',
    )
    list_filter = ('is_processed', 'is_active')
    search_fields = ('user__username',)
    readonly_fields = (
        'extracted_text',
        'extracted_skills_json',
        'extracted_experience_json',
        'extracted_education_json',
        'ml_model_version',
    )


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'job',
        'match_score',
        'cv',
        'created_at',
    )
    list_filter = ('created_at',)
    search_fields = ('user__username', 'job__title')
    readonly_fields = (
        'matched_skills_json',
        'skill_gap_json',
        'explanation',
    )


@admin.register(Roadmap)
class RoadmapAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'target_job',
        'estimated_total_hours',
        'is_active',
        'created_at',
    )
    list_filter = ('is_active',)
    search_fields = ('user__username',)


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('sender', 'message', 'timestamp')


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'topic',
        'related_job',
        'started_at',
        'is_active',
    )
    list_filter = ('is_active',)
    search_fields = ('user__username', 'topic')
    inlines = [ChatMessageInline]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'sender', 'timestamp')
    list_filter = ('sender',)


@admin.register(SystemConfiguration)
class SystemConfigurationAdmin(admin.ModelAdmin):
    list_display = (
        'ai_model_name',
        'max_cv_size_mb',
        'updated_at',
    )

    def has_add_permission(self, request):
        if self.model.objects.count() >= 1:
            return False
        return super().has_add_permission(request)