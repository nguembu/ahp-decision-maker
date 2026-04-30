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
            'column_sums': result['column_sums'],
            'row_sums': result['row_sums'],
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
    """Run full AHP analysis (INFO 4178 variant) and store results."""
    problem = _get_problem_or_404(request, problem_pk)
    if problem is None:
        return Response({'detail': 'Problème non trouvé.'}, status=404)

    try:
        matrix_obj = ComparisonMatrix.objects.get(problem=problem, matrix_type='criteria')
    except ComparisonMatrix.DoesNotExist:
        return Response({'error': 'Veuillez d\'abord soumettre la matrice de comparaison.'}, status=400)

    criteria = list(problem.criteria.all().order_by('order', 'created_at'))
    alternatives = list(problem.alternatives.all().order_by('order', 'created_at'))

    if len(criteria) < 2 or len(alternatives) < 2:
        return Response({'error': 'Au moins 2 critères et 2 alternatives sont requis.'}, status=400)

    weights_list = matrix_obj.weights or []
    criteria_weights = {str(c.id): w for c, w in zip(criteria, weights_list)}

    # Collect raw alternative scores
    scores_raw: dict = {}
    for alt in alternatives:
        scores_raw[str(alt.id)] = {}
        for crit in criteria:
            score_obj = AlternativeScore.objects.filter(alternative=alt, criterion=crit).first()
            val = 0.0
            if score_obj:
                val = float(score_obj.numeric_score) if score_obj.numeric_score is not None else float(score_obj.scale_preference.value if score_obj.scale_preference else 0.0)
            scores_raw[str(alt.id)][str(crit.id)] = val

    # Synthesis: Total Weight = sum(RawValue * Weight) as per INFO 4178 Step vii
    final_scores = {}
    for alt_id, scores in scores_raw.items():
        final_scores[alt_id] = sum(scores[cid] * criteria_weights[cid] for cid in criteria_weights)

    ranking = AHPCalculator.generate_ranking(final_scores)

    # Inconsistency info (INF4178 epsilon approach)
    inconsistency_reasons = []
    detailed_consistency = AHPCalculator.check_consistency(matrix_obj.matrix_data, matrix_obj.weights)
    
    if not detailed_consistency['is_consistent']:
        names = [c.name for c in criteria]
        pairs = AHPCalculator.get_inconsistent_pairs(matrix_obj.matrix_data, matrix_obj.weights, names)
        for p in pairs:
            inconsistency_reasons.append(
                f"Paire problématique : {p['pair']} (Val={p['actual']:.2f}, Attendu={p['expected']:.2f})"
            )
        detailed_consistency['inconsistent_pairs'] = pairs

    # Update alternative ranks and final scores in DB
    for item in ranking:
        alt = next(a for a in alternatives if str(a.id) == item['alternative_id'])
        alt.final_score = item['score']
        alt.rank = item['rank']
        alt.save(update_fields=['final_score', 'rank'])

    # Update criteria weights in DB
    for crit in criteria:
        crit.weight = criteria_weights.get(str(crit.id), 0.0)
        crit.save(update_fields=['weight'])

    problem.status = 'completed'
    problem.save(update_fields=['status'])

    result_obj, _ = AnalysisResult.objects.update_or_create(
        problem=problem,
        defaults={
            'criteria_weights': criteria_weights,
            'criteria_matrix': matrix_obj.matrix_data,
            'criteria_matrix_normalized': matrix_obj.normalized_data,
            'criteria_column_sums': matrix_obj.column_sums,
            'criteria_row_sums': matrix_obj.row_sums,
            'alternative_scores': final_scores,
            'alternative_scores_raw': scores_raw,
            'ranking': ranking,
            'best_alternative_id': ranking[0]['alternative_id'],
            'best_alternative_name': next(a.name for a in alternatives if str(a.id) == ranking[0]['alternative_id']),
            'best_alternative_score': ranking[0]['score'],
            'is_consistent': matrix_obj.is_consistent,
            'consistency_ratio': matrix_obj.consistency_ratio,
            'consistency_details': detailed_consistency,
            'inconsistency_reasons': inconsistency_reasons,
            'average_score': float(np.mean(list(final_scores.values()))),
            'std_deviation': float(np.std(list(final_scores.values()))),
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
        return Response({'detail': 'Aucun résultat.'}, status=404)


def _get_problem_or_404(request, problem_pk):
    from problems.models import DecisionProblem
    try:
        return DecisionProblem.objects.get(pk=problem_pk, created_by=request.user)
    except DecisionProblem.DoesNotExist:
        return None
