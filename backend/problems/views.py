import numpy as np
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from problems.models import DecisionProblem, Criterion, Alternative, AlternativeScore, ScalePreference
from problems.serializers import (
    DecisionProblemListSerializer, DecisionProblemDetailSerializer,
    CriterionSerializer, AlternativeSerializer,
    AlternativeScoreSerializer, ScalePreferenceSerializer
)


class DecisionProblemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-updated_at']

    def get_queryset(self):
        return DecisionProblem.objects.filter(created_by=self.request.user).prefetch_related(
            'criteria', 'alternatives'
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return DecisionProblemListSerializer
        return DecisionProblemDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        original = self.get_object()
        new_problem = DecisionProblem.objects.create(
            title=f"{original.title} (Copie)",
            description=original.description,
            goal=original.goal,
            created_by=request.user
        )
        for c in original.criteria.all():
            Criterion.objects.create(
                problem=new_problem, name=c.name, description=c.description,
                criterion_type=c.criterion_type, scale_type=c.scale_type, order=c.order
            )
        for a in original.alternatives.all():
            Alternative.objects.create(
                problem=new_problem, name=a.name, description=a.description, order=a.order
            )
        serializer = DecisionProblemDetailSerializer(new_problem)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CriterionViewSet(viewsets.ModelViewSet):
    serializer_class = CriterionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        problem_id = self.kwargs.get('problem_pk')
        return Criterion.objects.filter(
            problem_id=problem_id,
            problem__created_by=self.request.user
        )

    def perform_create(self, serializer):
        problem_id = self.kwargs.get('problem_pk')
        problem = DecisionProblem.objects.get(pk=problem_id, created_by=self.request.user)
        serializer.save(problem=problem)


class AlternativeViewSet(viewsets.ModelViewSet):
    serializer_class = AlternativeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        problem_id = self.kwargs.get('problem_pk')
        return Alternative.objects.filter(
            problem_id=problem_id,
            problem__created_by=self.request.user
        )

    def perform_create(self, serializer):
        problem_id = self.kwargs.get('problem_pk')
        problem = DecisionProblem.objects.get(pk=problem_id, created_by=self.request.user)
        serializer.save(problem=problem)


class AlternativeScoreViewSet(viewsets.ModelViewSet):
    serializer_class = AlternativeScoreSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        alt_id = self.kwargs.get('alternative_pk')
        return AlternativeScore.objects.filter(
            alternative_id=alt_id,
            alternative__problem__created_by=self.request.user
        )

    def perform_create(self, serializer):
        alt_id = self.kwargs.get('alternative_pk')
        alternative = Alternative.objects.get(
            pk=alt_id, problem__created_by=self.request.user
        )
        # Upsert: update if exists
        existing = AlternativeScore.objects.filter(
            alternative=alternative,
            criterion=serializer.validated_data['criterion']
        ).first()
        if existing:
            for attr, value in serializer.validated_data.items():
                setattr(existing, attr, value)
            existing.save()
        else:
            serializer.save(alternative=alternative)


class ScalePreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = ScalePreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        criterion_id = self.kwargs.get('criterion_pk')
        return ScalePreference.objects.filter(
            criterion_id=criterion_id,
            criterion__problem__created_by=self.request.user
        )

    def perform_create(self, serializer):
        criterion_id = self.kwargs.get('criterion_pk')
        criterion = Criterion.objects.get(
            pk=criterion_id, problem__created_by=self.request.user
        )
        serializer.save(criterion=criterion)
