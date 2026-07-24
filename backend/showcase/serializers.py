from rest_framework import serializers
from .models import Project, ProjectTag


class ProjectTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectTag
        fields = ('id', 'name')


class ProjectSerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True, default='')
    tags = ProjectTagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    owner_name = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ('id', 'user', 'title', 'description', 'image', 'github_url', 'live_url',
                  'tags', 'tag_names', 'is_featured', 'created_at', 'owner_name',
                  'likes_count', 'is_liked')
        read_only_fields = ('id', 'user', 'created_at', 'owner_name', 'likes_count', 'is_liked')

    def get_owner_name(self, obj):
        if obj.user:
            if obj.user.full_name and obj.user.full_name.strip():
                return obj.user.full_name.strip()
            if obj.user.email:
                return obj.user.email.split('@')[0].capitalize()
        return 'Developer'

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        project = Project.objects.create(**validated_data)
        for name in tag_names:
            tag, _ = ProjectTag.objects.get_or_create(name=name.strip().lower())
            project.tags.add(tag)
        return project

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        project = super().update(instance, validated_data)
        if tag_names is not None:
            project.tags.clear()
            for name in tag_names:
                tag, _ = ProjectTag.objects.get_or_create(name=name.strip().lower())
                project.tags.add(tag)
        return project
