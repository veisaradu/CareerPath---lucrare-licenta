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
    list_display = ('title', 'category', 'is_active')
    list_filter = ('is_active', 'category')
    search_fields = ('title', 'description')
    filter_horizontal = ('required_skills',)


@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = ('user', 'uploaded_at', 'is_processed', 'processed_at')
    list_filter = ('is_processed',)
    search_fields = ('user__username',)
    readonly_fields = ('extracted_skills_json',)


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'job', 'match_score', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'job__title')


@admin.register(Roadmap)
class RoadmapAdmin(admin.ModelAdmin):
    list_display = ('user', 'target_job', 'created_at')
    search_fields = ('user__username',)


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('sender', 'message', 'timestamp')


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'started_at', 'is_active')
    list_filter = ('is_active',)
    inlines = [ChatMessageInline]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'sender', 'timestamp')
    list_filter = ('sender',)


@admin.register(SystemConfiguration)
class SystemConfigurationAdmin(admin.ModelAdmin):
    list_display = ('ai_model_name', 'max_cv_size_mb', 'updated_at')

    def has_add_permission(self, request):
        if self.model.objects.count() >= 1:
            return False
        return super().has_add_permission(request)