import numpy as np
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction

from problems.models import DecisionProblem, Criterion, Alternative, AlternativeScore
from analysis.models import ComparisonMatrix, AnalysisResult
from analysis.serializers import ComparisonMatrixSerializer, AnalysisResultSerializer
from utils.ahp_calculator import AHPCalculator
from utils.matrix_processor import MatrixProcessor


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def matrix_view(request, problem_pk):
    """GET or create/update the pairwise comparison matrix for a problem."""
    problem = _get_problem_or_404(request, problem_pk)
    if problem is None:
        return Response({'detail': 'Problème non trouvé.'}, status=404)

    if request.method == 'GET':
        try:
            matrix_obj = ComparisonMatrix.objects.get(problem=problem, matrix_type='criteria')
            return Response(ComparisonMatrixSerializer(matrix_obj).data)
        except ComparisonMatrix.DoesNotExist:
            return Response({'detail': 'Matrice non trouvée.'}, status=404)

    # POST: create or update
    matrix_data = request.data.get('matrix_data')
    if not matrix_data:
        return Response({'error': 'matrix_data est requis.'}, status=400)

    # Validate
    validation = MatrixProcessor.full_validation(matrix_data)
    if not validation['is_valid']:
        return Response({'error': 'Matrice invalide.', 'details': validation['errors']}, status=400)

    # Enforce reciprocity
    matrix_data = MatrixProcessor.ensure_reciprocity(matrix_data)

    # Calculate
    result = AHPCalculator.process_matrix(matrix_data)
    consistency = result['consistency']

    n = len(matrix_data)
    matrix_obj, _ = ComparisonMatrix.objects.update_or_create(
        problem=problem,
        matrix_type='criteria',
        defaults={
            'dimension': n,
            'matrix_data': matrix_data,
            'normalized_data': result['normalized'],
            'weights': result['weights'],
            'lambda_max': consistency['lambda_max'],
            'consistency_index': consistency['consistency_index'],
            'consistency_ratio': consistency['consistency_ratio'],
            'is_consistent': consistency['is_consistent'],
        }
    )
    return Response(ComparisonMatrixSerializer(matrix_obj).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_matrix(request, problem_pk):
    """Validate a matrix without saving."""
    matrix_data = request.data.get('matrix_data')
    if not matrix_data:
        return Response({'error': 'matrix_data est requis.'}, status=400)

    validation = MatrixProcessor.full_validation(matrix_data)
    if not validation['is_valid']:
        return Response({'is_valid': False, 'errors': validation['errors'], 'warnings': validation['warnings']})

    matrix_data = MatrixProcessor.ensure_reciprocity(matrix_data)
    result = AHPCalculator.process_matrix(matrix_data)
    consistency = result['consistency']

    return Response({
        'is_valid': True,
        'warnings': validation['warnings'],
        'weights': result['weights'],
        'consistency': consistency,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def analyze(request, problem_pk):
    """Run full AHP analysis and store results."""
    problem = _get_problem_or_404(request, problem_pk)
    if problem is None:
        return Response({'detail': 'Problème non trouvé.'}, status=404)

    # Check matrix
    try:
        matrix_obj = ComparisonMatrix.objects.get(problem=problem, matrix_type='criteria')
    except ComparisonMatrix.DoesNotExist:
        return Response({'error': 'Veuillez d\'abord soumettre la matrice de comparaison.'}, status=400)

    criteria = list(problem.criteria.all().order_by('order', 'created_at'))
    alternatives = list(problem.alternatives.all().order_by('order', 'created_at'))

    if len(criteria) < 2:
        return Response({'error': 'Au moins 2 critères sont requis.'}, status=400)
    if len(alternatives) < 2:
        return Response({'error': 'Au moins 2 alternatives sont requises.'}, status=400)

    # Build criteria_weights dict from saved matrix weights
    weights_list = matrix_obj.weights or []
    if len(weights_list) != len(criteria):
        return Response({'error': 'Dimension de la matrice ne correspond pas aux critères.'}, status=400)

    criteria_weights = {str(c.id): w for c, w in zip(criteria, weights_list)}

    # Collect alternative scores, normalize them per criterion
    scores_by_alt: dict = {}
    for alt in alternatives:
        scores_by_alt[str(alt.id)] = {}
        for crit in criteria:
            score_obj = AlternativeScore.objects.filter(alternative=alt, criterion=crit).first()
            raw_score = 0.0
            if score_obj:
                if score_obj.numeric_score is not None:
                    raw_score = float(score_obj.numeric_score)
                elif score_obj.scale_preference:
                    raw_score = float(score_obj.scale_preference.value)
            scores_by_alt[str(alt.id)][str(crit.id)] = raw_score

    # Normalize scores per criterion (min-max to [0,1])
    for crit in criteria:
        cid = str(crit.id)
        vals = [scores_by_alt[str(a.id)][cid] for a in alternatives]
        min_v, max_v = min(vals), max(vals)
        span = max_v - min_v if max_v != min_v else 1.0
        for alt in alternatives:
            scores_by_alt[str(alt.id)][cid] = (scores_by_alt[str(alt.id)][cid] - min_v) / span

    final_scores = AHPCalculator.calculate_alternative_scores(scores_by_alt, criteria_weights)
    ranking = AHPCalculator.generate_ranking(final_scores)

    consistency_details = {
        'lambda_max': matrix_obj.lambda_max,
        'consistency_index': matrix_obj.consistency_index,
        'consistency_ratio': matrix_obj.consistency_ratio,
        'is_consistent': matrix_obj.is_consistent,
    }

    # Best alternative
    best = ranking[0]
    best_alt_name = next(str(a.name) for a in alternatives if str(a.id) == best['alternative_id'])

    # Stats
    score_vals = list(final_scores.values())
    avg = float(np.mean(score_vals))
    std = float(np.std(score_vals))

    # Inconsistency info
    inconsistency_reasons = []
    if not matrix_obj.is_consistent:
        inconsistency_reasons.append(
            f"CR = {matrix_obj.consistency_ratio:.3f} > 0.1 : Matrice incohérente. Révisez vos comparaisons."
        )

    # Update alternative ranks and scores
    for item in ranking:
        alt = next(a for a in alternatives if str(a.id) == item['alternative_id'])
        alt.final_score = item['score']
        alt.rank = item['rank']
        alt.save(update_fields=['final_score', 'rank'])

    # Update criteria weights
    for crit in criteria:
        crit.weight = criteria_weights.get(str(crit.id), 0.0)
        crit.save(update_fields=['weight'])

    # Update problem status
    problem.status = 'completed'
    problem.save(update_fields=['status'])

    # Store result
    result_obj, _ = AnalysisResult.objects.update_or_create(
        problem=problem,
        defaults={
            'criteria_weights': criteria_weights,
            'criteria_matrix': matrix_obj.matrix_data,
            'criteria_matrix_normalized': matrix_obj.normalized_data,
            'alternative_scores': final_scores,
            'alternative_scores_raw': scores_by_alt,
            'ranking': ranking,
            'best_alternative_id': best['alternative_id'],
            'best_alternative_name': best_alt_name,
            'best_alternative_score': best['score'],
            'is_consistent': matrix_obj.is_consistent,
            'consistency_ratio': matrix_obj.consistency_ratio,
            'consistency_details': consistency_details,
            'inconsistency_reasons': inconsistency_reasons,
            'average_score': avg,
            'std_deviation': std,
        }
    )

    return Response(AnalysisResultSerializer(result_obj).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def results(request, problem_pk):
    """Retrieve stored analysis results."""
    problem = _get_problem_or_404(request, problem_pk)
    if problem is None:
        return Response({'detail': 'Problème non trouvé.'}, status=404)
    try:
        result_obj = AnalysisResult.objects.get(problem=problem)
        return Response(AnalysisResultSerializer(result_obj).data)
    except AnalysisResult.DoesNotExist:
        return Response({'detail': 'Aucun résultat. Lancez d\'abord l\'analyse.'}, status=404)


def _get_problem_or_404(request, problem_pk):
    from problems.models import DecisionProblem
    try:
        return DecisionProblem.objects.get(pk=problem_pk, created_by=request.user)
    except DecisionProblem.DoesNotExist:
        return None
