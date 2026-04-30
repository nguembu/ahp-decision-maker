from django.db import models
from django.contrib.auth.models import User
from uuid import uuid4


class DecisionProblem(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('in_progress', 'En cours'),
        ('completed', 'Complété'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    goal = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='problems')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [models.Index(fields=['created_by', '-created_at'])]

    def __str__(self):
        return self.title


class Criterion(models.Model):
    TYPE_CHOICES = [
        ('quantitative', 'Quantitatif'),
        ('categorical', 'Catégorique'),
    ]
    SCALE_TYPES = [
        ('linear', 'Linéaire'),
        ('logarithmic', 'Logarithmique'),
        ('custom', 'Personnalisé'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    problem = models.ForeignKey(DecisionProblem, on_delete=models.CASCADE, related_name='criteria')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    criterion_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='quantitative')
    scale_type = models.CharField(max_length=20, choices=SCALE_TYPES, default='linear')
    weight = models.FloatField(default=0.0)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('problem', 'name')
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.problem.title} - {self.name}"


class ScalePreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    criterion = models.ForeignKey(Criterion, on_delete=models.CASCADE, related_name='scale_preferences')
    label = models.CharField(max_length=100)
    value = models.FloatField()
    numeric_value = models.IntegerField()
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        unique_together = ('criterion', 'label')
        ordering = ['order']

    def __str__(self):
        return f"{self.criterion.name} - {self.label}"


class Alternative(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    problem = models.ForeignKey(DecisionProblem, on_delete=models.CASCADE, related_name='alternatives')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    final_score = models.FloatField(default=0.0)
    rank = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('problem', 'name')
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.problem.title} - {self.name}"


class AlternativeScore(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    alternative = models.ForeignKey(Alternative, on_delete=models.CASCADE, related_name='scores')
    criterion = models.ForeignKey(Criterion, on_delete=models.CASCADE)
    numeric_score = models.FloatField(null=True, blank=True)
    categorical_value = models.CharField(max_length=255, null=True, blank=True)
    scale_preference = models.ForeignKey(ScalePreference, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('alternative', 'criterion')

    def __str__(self):
        return f"{self.alternative.name} - {self.criterion.name}"
