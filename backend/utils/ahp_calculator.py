import numpy as np
from typing import List, Dict

RANDOM_INDEX = {
    1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24,
    7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
}


class AHPCalculator:
    """Core AHP calculation engine."""

    @staticmethod
    def normalize_matrix(matrix: List[List[float]]) -> List[List[float]]:
        """Normalize a matrix by dividing each element by its column sum."""
        m = np.array(matrix, dtype=float)
        col_sums = m.sum(axis=0)
        # Avoid division by zero
        col_sums[col_sums == 0] = 1.0
        normalized = m / col_sums
        return normalized.tolist()

    @staticmethod
    def calculate_weights(normalized_matrix: List[List[float]]) -> List[float]:
        """Calculate weights as the average of each row in the normalized matrix."""
        m = np.array(normalized_matrix, dtype=float)
        weights = m.mean(axis=1)
        return weights.tolist()

    @staticmethod
    def calculate_lambda_max(matrix: List[List[float]], weights: List[float]) -> float:
        """Calculate λ_max for consistency checking using standard Mw."""
        m = np.array(matrix, dtype=float)
        w = np.array(weights, dtype=float)
        # Standard: Aw_i = sum_j M_ij * w_j
        weighted_sum = m @ w
        ratios = weighted_sum / (w + 1e-10)
        return float(np.mean(ratios))

    @staticmethod
    def check_consistency(matrix: List[List[float]], weights: List[float]) -> Dict:
        """Standard AHP consistency check using Mw = lambda*w."""
        n = len(matrix)
        if n < 3:
            return {
                'is_consistent': True, 
                'consistency_ratio': 0.0, 
                'consistency_index': 0.0, 
                'lambda_max': float(n),
                'weighted_sum': weights,
                'lambda_vector': [1.0] * n
            }

        m = np.array(matrix, dtype=float)
        w = np.array(weights, dtype=float)
        
        # Weighted Sum Vector = Matrix @ Weights
        weighted_sum = (m @ w).tolist()
        
        # Lambda standard: (Aw)_i / w_i
        lambda_vector = [(m @ w)[i] / (w[i] + 1e-10) for i in range(n)]
        lambda_max = float(np.mean(lambda_vector))
        
        ci = (lambda_max - n) / (n - 1)
        ri = RANDOM_INDEX.get(n, 1.49)
        cr = ci / ri if ri > 0 else 0.0
        
        return {
            'is_consistent': cr < 0.10,
            'consistency_ratio': float(cr),
            'consistency_index': float(ci),
            'random_index': float(ri),
            'lambda_max': float(lambda_max),
            'weighted_sum': weighted_sum,
            'lambda_vector': [float(x) for x in lambda_vector]
        }

    @staticmethod
    def get_inconsistent_pairs(matrix: List[List[float]], weights: List[float], criteria_names: List[str]) -> List[Dict]:
        """Identify top 3 inconsistent pairs using epsilon = |aij - (wi/wj)|."""
        n = len(matrix)
        w = np.array(weights, dtype=float)
        errors = []
        for i in range(n):
            for j in range(n):
                if i != j:
                    expected = w[i] / (w[j] + 1e-10)
                    actual = matrix[i][j]
                    epsilon = abs(actual - expected)
                    errors.append({
                        'pair': f"{criteria_names[i]} vs {criteria_names[j]}",
                        'epsilon': float(epsilon),
                        'actual': float(actual),
                        'expected': float(expected)
                    })
        # Sort by epsilon descending and take top 3
        return sorted(errors, key=lambda x: x['epsilon'], reverse=True)[:3]

    @staticmethod
    def min_max_normalize(values: List[float], higher_is_better: bool = True) -> List[float]:
        """Perform min-max normalization, with support for cost criteria."""
        if not values:
            return []
        v_min = min(values)
        v_max = max(values)
        span = v_max - v_min
        if span == 0:
            return [1.0] * len(values)
        
        normalized = [(v - v_min) / span for v in values]
        if not higher_is_better:
            normalized = [1.0 - n for n in normalized]
        return normalized

    @staticmethod
    def process_matrix(matrix: List[List[float]], criteria_names: List[str] = None) -> Dict:
        """Full pipeline with INFO 4178 intermediate data and inconsistency detection."""
        m = np.array(matrix, dtype=float)
        column_sums = m.sum(axis=0).tolist()
        row_sums = m.sum(axis=1).tolist()
        
        normalized = AHPCalculator.normalize_matrix(matrix)
        weights = AHPCalculator.calculate_weights(normalized)
        consistency = AHPCalculator.check_consistency(matrix, weights)
        
        inconsistent_pairs = []
        if criteria_names and not consistency['is_consistent']:
            inconsistent_pairs = AHPCalculator.get_inconsistent_pairs(matrix, weights, criteria_names)
        
        return {
            'column_sums': [round(x, 6) for x in column_sums],
            'row_sums': [round(x, 6) for x in row_sums],
            'normalized': normalized,
            'weights': weights,
            'consistency': consistency,
            'inconsistent_pairs': inconsistent_pairs
        }

    @staticmethod
    def calculate_alternative_scores(
        scores_by_alternative: Dict[str, Dict[str, float]],
        criteria_weights: Dict[str, float]
    ) -> Dict[str, float]:
        """
        scores_by_alternative: {alt_id: {criterion_id: normalized_score}}
        criteria_weights: {criterion_id: weight}
        Returns: {alt_id: final_score}
        """
        result = {}
        for alt_id, crit_scores in scores_by_alternative.items():
            score = sum(
                criteria_weights.get(crit_id, 0) * val
                for crit_id, val in crit_scores.items()
            )
            result[alt_id] = round(score, 6)
        return result

    @staticmethod
    def generate_ranking(final_scores: Dict[str, float]) -> List[Dict]:
        """Sort alternatives by score and assign ranks."""
        total = sum(final_scores.values()) or 1
        sorted_items = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
        return [
            {
                'rank': idx + 1,
                'alternative_id': str(alt_id),
                'score': round(score, 4),
                'percentage': round(score / total * 100, 2)
            }
            for idx, (alt_id, score) in enumerate(sorted_items)
        ]
