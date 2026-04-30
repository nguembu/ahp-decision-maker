from rest_framework import serializers
from analysis.models import ComparisonMatrix, AnalysisResult


class ComparisonMatrixSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComparisonMatrix
        fields = [
            'id', 'matrix_type', 'dimension', 'matrix_data',
            'normalized_data', 'column_sums', 'row_sums', 'weights',
            'lambda_max', 'consistency_index', 'consistency_ratio', 'is_consistent',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'normalized_data', 'weights', 'lambda_max',
            'consistency_index', 'consistency_ratio', 'is_consistent',
            'created_at', 'updated_at'
        ]


class AnalysisResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = [
            'id', 'problem',
            'criteria_weights', 'criteria_matrix', 'criteria_matrix_normalized', 'criteria_column_sums', 'criteria_row_sums',
            'alternative_scores', 'alternative_scores_raw', 'ranking',
            'best_alternative_id', 'best_alternative_name', 'best_alternative_score',
            'is_consistent', 'consistency_ratio', 'consistency_details', 'inconsistency_reasons',
            'average_score', 'std_deviation',
            'generated_at'
        ]
