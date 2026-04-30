from django.contrib import admin
from problems.models import DecisionProblem, Criterion, Alternative, AlternativeScore, ScalePreference


@admin.register(DecisionProblem)
class DecisionProblemAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'created_by', 'created_at']
    list_filter = ['status']
    search_fields = ['title']


@admin.register(Criterion)
class CriterionAdmin(admin.ModelAdmin):
    list_display = ['name', 'problem', 'criterion_type', 'weight', 'order']
    list_filter = ['criterion_type']


@admin.register(Alternative)
class AlternativeAdmin(admin.ModelAdmin):
    list_display = ['name', 'problem', 'final_score', 'rank']


@admin.register(AlternativeScore)
class AlternativeScoreAdmin(admin.ModelAdmin):
    list_display = ['alternative', 'criterion', 'numeric_score']


@admin.register(ScalePreference)
class ScalePreferenceAdmin(admin.ModelAdmin):
    list_display = ['criterion', 'label', 'value', 'numeric_value', 'order']
