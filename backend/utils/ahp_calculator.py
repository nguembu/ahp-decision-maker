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
        col_sums[col_sums == 0] = 1
        return (m / col_sums).tolist()

    @staticmethod
    def calculate_weights(normalized_matrix: List[List[float]]) -> List[float]:
        """Calculate priority weights as row averages of the normalized matrix."""
        m = np.array(normalized_matrix)
        weights = m.mean(axis=1)
        total = weights.sum()
        if total > 0:
            weights = weights / total
        return weights.tolist()

    @staticmethod
    def calculate_lambda_max(matrix: List[List[float]], weights: List[float]) -> float:
        """Calculate λ_max for consistency checking."""
        m = np.array(matrix, dtype=float)
        w = np.array(weights, dtype=float)
        weighted_sum = m @ w
        # λ_max = mean of (Aw_i / w_i) for each i
        ratios = weighted_sum / (w + 1e-10)
        return float(np.mean(ratios))

    @staticmethod
    def check_consistency(matrix: List[List[float]], weights: List[float]) -> Dict:
        """Return CI, CR, and consistency verdict."""
        n = len(matrix)
        if n < 2:
            return {'lambda_max': n, 'consistency_index': 0.0,
                    'consistency_ratio': 0.0, 'is_consistent': True, 'random_index': 0.0}

        lambda_max = AHPCalculator.calculate_lambda_max(matrix, weights)
        ci = (lambda_max - n) / (n - 1)
        ri = RANDOM_INDEX.get(n, 1.49)
        cr = ci / ri if ri > 0 else 0.0

        return {
            'lambda_max': round(float(lambda_max), 4),
            'consistency_index': round(float(ci), 4),
            'consistency_ratio': round(float(cr), 4),
            'random_index': float(ri),
            'is_consistent': cr <= 0.1
        }

    @staticmethod
    def process_matrix(matrix: List[List[float]]) -> Dict:
        """Full pipeline: normalize → weights → consistency."""
        normalized = AHPCalculator.normalize_matrix(matrix)
        weights = AHPCalculator.calculate_weights(normalized)
        consistency = AHPCalculator.check_consistency(matrix, weights)
        return {
            'normalized': normalized,
            'weights': weights,
            'consistency': consistency
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
