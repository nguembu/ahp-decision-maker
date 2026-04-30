from django.contrib import admin
from analysis.models import ComparisonMatrix, AnalysisResult


@admin.register(ComparisonMatrix)
class ComparisonMatrixAdmin(admin.ModelAdmin):
    list_display = ['problem', 'matrix_type', 'dimension', 'is_consistent', 'consistency_ratio']


@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ['problem', 'best_alternative_name', 'best_alternative_score', 'is_consistent']
