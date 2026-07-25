from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, Resume

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'password', 'password_confirm')

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        import re
        pwd = data['password']
        if len(pwd) < 8:
            raise serializers.ValidationError({'password': 'Password must be at least 8 characters long.'})
        if not re.search(r'[A-Z]', pwd) or not re.search(r'[a-z]', pwd) or not re.search(r'\d', pwd):
            raise serializers.ValidationError({'password': 'Password must contain uppercase, lowercase & a number.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.get_or_create(user=user)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('bio', 'avatar', 'dev_rank', 'total_xp', 'streak_days',
                  'github_url', 'linkedin_url', 'website_url', 'created_at')
        read_only_fields = ('dev_rank', 'total_xp', 'streak_days', 'created_at')


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    xp_to_next_rank = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'profile', 'xp_to_next_rank', 'date_joined')
        read_only_fields = ('id', 'date_joined')

    def get_xp_to_next_rank(self, obj):
        try:
            return obj.profile.xp_for_next_rank()
        except Exception:
            return None


class UpdateProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', required=False)

    class Meta:
        model = UserProfile
        fields = ('bio', 'avatar', 'github_url', 'linkedin_url', 'website_url', 'full_name')

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if 'full_name' in user_data:
            instance.user.full_name = user_data['full_name']
            instance.user.save()
        return super().update(instance, validated_data)


class LeaderboardSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name')
    email = serializers.EmailField(source='user.email')
    rank_position = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ('full_name', 'email', 'dev_rank', 'total_xp', 'streak_days', 'avatar', 'rank_position')

    def get_rank_position(self, obj):
        return self.context.get('rank_position', 0)


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = (
            'id', 'personal_info', 'experience', 'projects',
            'skills', 'education', 'certifications',
            'target_role', 'ats_score', 'audit_report',
            'is_premium_unlocked', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'ats_score', 'audit_report', 'is_premium_unlocked', 'created_at', 'updated_at')


class ResumeAuditSerializer(serializers.Serializer):
    """Used only for returning ATS audit results (no model write)."""
    ats_score    = serializers.IntegerField()
    audit_report = serializers.DictField()
    target_role  = serializers.CharField()


from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'is_read', 'created_at')
        read_only_fields = ('id', 'created_at')
