from rest_framework import serializers
from .models import CodeReview


class CodeReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CodeReview
        fields = [
            'id', 'repo_url', 'repo_owner', 'repo_name', 'status',
            'overall_score', 'total_issues',
            'critical_count', 'high_count', 'medium_count', 'low_count',
            'report_json', 'created_at',
        ]
        read_only_fields = fields
