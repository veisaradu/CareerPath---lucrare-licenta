from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, UserSkillProficiency

User = get_user_model()


class UserSkillProficiencySerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(
        source='skill.name', read_only=True
    )
    skill_category = serializers.CharField(
        source='skill.category.name', read_only=True
    )

    class Meta:
        model = UserSkillProficiency
        fields = [
            'id',
            'user',
            'skill',
            'skill_name',
            'skill_category',
            'level',
            'source',
            'years_experience',
        ]
        read_only_fields = ['user']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id',
            'user',
            'education_level',
            'education_details',
            'interests',
            'experience_years',
            'experience_details',
            'preferred_categories',
            'desired_role',
            'open_to_remote',
            'location',
            'ai_summary',
            'updated_at',
        ]
        read_only_fields = ['user', 'ai_summary', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    skill_proficiencies = UserSkillProficiencySerializer(
        many=True, read_only=True
    )

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'profile',
            'skill_proficiencies',
        ]


class RegisterSerializer(serializers.ModelSerializer):

    username = serializers.CharField(max_length=150, validators=[])
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(
        write_only=True, label='Confirm password'
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password2',
            'first_name',
            'last_name',
        ]

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                'Unable to register with the provided information.'
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'Unable to register with the provided information.'
            )
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {'password': 'Passwords do not match.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)