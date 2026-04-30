from typing import List, Tuple, Dict


VALID_SAATY_VALUES = [
    1/9, 1/8, 1/7, 1/6, 1/5, 1/4, 1/3, 1/2,
    1, 2, 3, 4, 5, 6, 7, 8, 9
]


class MatrixProcessor:
    """Validates and processes pairwise comparison matrices."""

    @staticmethod
    def validate_format(matrix: List[List[float]]) -> Tuple[bool, str]:
        if not isinstance(matrix, list) or len(matrix) == 0:
            return False, "La matrice doit être une liste non vide."
        n = len(matrix)
        for i, row in enumerate(matrix):
            if not isinstance(row, list) or len(row) != n:
                return False, f"Ligne {i}: longueur {len(row) if isinstance(row, list) else '?'} attendue {n}."
        return True, "OK"

    @staticmethod
    def validate_diagonal(matrix: List[List[float]], tol: float = 0.001) -> Tuple[bool, List[str]]:
        errors = []
        for i in range(len(matrix)):
            if abs(matrix[i][i] - 1.0) > tol:
                errors.append(f"Diagonal ({i},{i}) = {matrix[i][i]} ≠ 1")
        return len(errors) == 0, errors

    @staticmethod
    def validate_reciprocity(matrix: List[List[float]], tol: float = 0.05) -> Tuple[bool, List[str]]:
        errors = []
        n = len(matrix)
        for i in range(n):
            for j in range(i + 1, n):
                a_ij = matrix[i][j]
                a_ji = matrix[j][i]
                if a_ij == 0 or a_ji == 0:
                    errors.append(f"Zéro à ({i},{j}) ou ({j},{i})")
                    continue
                expected = 1.0 / a_ji
                if abs(a_ij - expected) / (expected + 1e-10) > tol:
                    errors.append(f"({i},{j}): {a_ij:.3f} ≠ 1/{a_ji:.3f}={expected:.3f}")
        return len(errors) == 0, errors

    @staticmethod
    def ensure_reciprocity(matrix: List[List[float]]) -> List[List[float]]:
        """Auto-fill the lower triangle from the upper triangle for strict reciprocity."""
        import copy
        m = copy.deepcopy(matrix)
        n = len(m)
        for i in range(n):
            m[i][i] = 1.0
            for j in range(i + 1, n):
                m[j][i] = 1.0 / m[i][j] if m[i][j] != 0 else 1.0
        return m

    @staticmethod
    def full_validation(matrix: List[List[float]]) -> Dict:
        result = {'is_valid': True, 'errors': [], 'warnings': []}

        ok, msg = MatrixProcessor.validate_format(matrix)
        if not ok:
            result['is_valid'] = False
            result['errors'].append(msg)
            return result

        ok, errs = MatrixProcessor.validate_diagonal(matrix)
        if not ok:
            result['is_valid'] = False
            result['errors'].extend(errs)

        ok, errs = MatrixProcessor.validate_reciprocity(matrix)
        if not ok:
            result['warnings'].extend(errs)

        return result
