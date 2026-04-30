from rest_framework import serializers
from problems.models import (
    DecisionProblem, Criterion, Alternative,
    AlternativeScore, ScalePreference
)


class ScalePreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScalePreference
        fields = ['id', 'label', 'value', 'numeric_value', 'description', 'order']


class CriterionSerializer(serializers.ModelSerializer):
    scale_preferences = ScalePreferenceSerializer(many=True, read_only=True)

    class Meta:
        model = Criterion
        fields = [
            'id', 'name', 'description', 'criterion_type',
            'scale_type', 'weight', 'order', 'scale_preferences',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['weight', 'created_at', 'updated_at']


class AlternativeScoreSerializer(serializers.ModelSerializer):
    criterion_name = serializers.CharField(source='criterion.name', read_only=True)
    scale_label = serializers.CharField(source='scale_preference.label', read_only=True, default=None)

    class Meta:
        model = AlternativeScore
        fields = [
            'id', 'criterion', 'criterion_name',
            'numeric_score', 'categorical_value',
            'scale_preference', 'scale_label'
        ]


class AlternativeSerializer(serializers.ModelSerializer):
    scores = AlternativeScoreSerializer(many=True, read_only=True)

    class Meta:
        model = Alternative
        fields = [
            'id', 'name', 'description', 'order',
            'final_score', 'rank', 'scores',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['final_score', 'rank', 'created_at', 'updated_at']


class DecisionProblemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    criteria_count = serializers.SerializerMethodField()
    alternatives_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DecisionProblem
        fields = [
            'id', 'title', 'description', 'goal', 'status', 'status_display',
            'criteria_count', 'alternatives_count', 'created_at', 'updated_at'
        ]

    def get_criteria_count(self, obj):
        return obj.criteria.count()

    def get_alternatives_count(self, obj):
        return obj.alternatives.count()


class DecisionProblemDetailSerializer(serializers.ModelSerializer):
    criteria = CriterionSerializer(many=True, read_only=True)
    alternatives = AlternativeSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DecisionProblem
        fields = [
            'id', 'title', 'description', 'goal', 'status', 'status_display',
            'created_at', 'updated_at', 'criteria', 'alternatives'
        ]
        read_only_fields = ['created_at', 'updated_at']
