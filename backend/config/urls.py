from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.decorators import api_view
from rest_framework.response import Response

from problems.views import (
    DecisionProblemViewSet, CriterionViewSet,
    AlternativeViewSet, AlternativeScoreViewSet, ScalePreferenceViewSet
)
from analysis.views import matrix_view, validate_matrix, analyze, results
from core.views import register

# Nested router for problems → criteria, alternatives, scores
router = DefaultRouter()
router.register(r'problems', DecisionProblemViewSet, basename='problems')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/register/', register, name='register'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Problems CRUD + duplicate
    path('api/', include(router.urls)),

    # Nested: criteria under a problem
    path('api/problems/<uuid:problem_pk>/criteria/',
         CriterionViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='problem-criteria-list'),
    path('api/problems/<uuid:problem_pk>/criteria/<uuid:pk>/',
         CriterionViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
         name='problem-criteria-detail'),

    # Scales under a criterion
    path('api/problems/<uuid:problem_pk>/criteria/<uuid:criterion_pk>/scales/',
         ScalePreferenceViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='criterion-scales-list'),
    path('api/problems/<uuid:problem_pk>/criteria/<uuid:criterion_pk>/scales/<uuid:pk>/',
         ScalePreferenceViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
         name='criterion-scales-detail'),

    # Nested: alternatives under a problem
    path('api/problems/<uuid:problem_pk>/alternatives/',
         AlternativeViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='problem-alternatives-list'),
    path('api/problems/<uuid:problem_pk>/alternatives/<uuid:pk>/',
         AlternativeViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
         name='problem-alternatives-detail'),

    # Scores under an alternative
    path('api/problems/<uuid:problem_pk>/alternatives/<uuid:alternative_pk>/scores/',
         AlternativeScoreViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='alternative-scores-list'),
    path('api/problems/<uuid:problem_pk>/alternatives/<uuid:alternative_pk>/scores/<uuid:pk>/',
         AlternativeScoreViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
         name='alternative-scores-detail'),

    # Analysis
    path('api/problems/<uuid:problem_pk>/matrix/', matrix_view, name='matrix'),
    path('api/problems/<uuid:problem_pk>/matrix/validate/', validate_matrix, name='matrix-validate'),
    path('api/problems/<uuid:problem_pk>/analyze/', analyze, name='analyze'),
    path('api/problems/<uuid:problem_pk>/results/', results, name='results'),
]