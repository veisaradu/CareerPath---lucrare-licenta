from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserProfile, UserSkillProficiency


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    pass


class UserSkillProficiencyInline(admin.TabularInline):
    model = UserSkillProficiency
    extra = 1
    autocomplete_fields = ['skill']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'education_level',
        'desired_role',
        'location',
    )
    search_fields = ('user__username', 'user__email')
    list_filter = ('education_level', 'open_to_remote')
    filter_horizontal = ('preferred_categories',)


@admin.register(UserSkillProficiency)
class UserSkillProficiencyAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'skill',
        'level',
        'source',
        'years_experience',
    )
    list_filter = ('level', 'source')
    search_fields = ('user__username', 'skill__name')
    autocomplete_fields = ['user', 'skill']