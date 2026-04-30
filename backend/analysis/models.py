from django.db import models
from uuid import uuid4


class ComparisonMatrix(models.Model):
    MATRIX_TYPE_CHOICES = [
        ('criteria', 'Comparaison de Critères'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    problem = models.ForeignKey(
        'problems.DecisionProblem', on_delete=models.CASCADE, related_name='comparison_matrices'
    )
    matrix_type = models.CharField(max_length=20, choices=MATRIX_TYPE_CHOICES, default='criteria')
    dimension = models.IntegerField()
    matrix_data = models.JSONField()
    normalized_data = models.JSONField(null=True, blank=True)
    column_sums = models.JSONField(null=True, blank=True) # [...]
    row_sums = models.JSONField(null=True, blank=True) # [...]

    # Calculated results
    weights = models.JSONField(null=True, blank=True)
    lambda_max = models.FloatField(null=True, blank=True)
    consistency_index = models.FloatField(null=True, blank=True)
    consistency_ratio = models.FloatField(null=True, blank=True)
    is_consistent = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('problem', 'matrix_type')

    def __str__(self):
        return f"{self.problem.title} - {self.get_matrix_type_display()}"


class AnalysisResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    problem = models.OneToOneField(
        'problems.DecisionProblem', on_delete=models.CASCADE, related_name='analysis_result'
    )

    criteria_weights = models.JSONField()         # {criterion_id: weight}
    criteria_matrix = models.JSONField(null=True) # [[...]]
    criteria_matrix_normalized = models.JSONField(null=True)
    criteria_column_sums = models.JSONField(null=True) # [...]
    criteria_row_sums = models.JSONField(null=True) # [...]
    alternative_scores = models.JSONField()       # {alternative_id: score}
    alternative_scores_raw = models.JSONField(null=True) # {alt_id: {crit_id: score}}
    ranking = models.JSONField()                  # [{rank, alternative_id, alternative_name, score, percentage}]

    best_alternative_id = models.CharField(max_length=255)
    best_alternative_name = models.CharField(max_length=255)
    best_alternative_score = models.FloatField()

    is_consistent = models.BooleanField(default=False)
    consistency_ratio = models.FloatField(null=True, blank=True)
    consistency_details = models.JSONField(null=True) # {lambda_max, ci, ri, cr}
    inconsistency_reasons = models.JSONField(default=list)

    average_score = models.FloatField()
    std_deviation = models.FloatField()

    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Résultats pour {self.problem.title}"
