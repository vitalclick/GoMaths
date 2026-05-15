"""Tests for the SymPy answer validator."""

from validation.sympy_validator import (
    ValidationStatus,
    validate_equivalent,
    validate_question_answer,
)


def test_string_match_is_equivalent() -> None:
    assert validate_equivalent("x = 4", "x = 4").status == ValidationStatus.EQUIVALENT


def test_commutative_addition_is_equivalent() -> None:
    assert validate_equivalent("x + 1", "1 + x").status == ValidationStatus.EQUIVALENT


def test_different_values_not_equivalent() -> None:
    assert validate_equivalent("x = 4", "x = 5").status == ValidationStatus.NOT_EQUIVALENT


def test_different_variables_not_equivalent() -> None:
    assert validate_equivalent("x = 4", "y = 4").status == ValidationStatus.NOT_EQUIVALENT


def test_simple_linear_equation_correct() -> None:
    r = validate_question_answer("2*x + 5 = 13", "x = 4")
    assert r.status == ValidationStatus.EQUIVALENT, r.detail


def test_simple_linear_equation_wrong() -> None:
    r = validate_question_answer("2*x + 5 = 13", "x = 5")
    assert r.status == ValidationStatus.NOT_EQUIVALENT, r.detail


def test_quadratic_two_roots_correct() -> None:
    r = validate_question_answer("x^2 + 5*x + 6 = 0", "x = -2 or x = -3")
    assert r.status == ValidationStatus.EQUIVALENT, r.detail


def test_quadratic_two_roots_wrong_one_root() -> None:
    r = validate_question_answer("x^2 + 5*x + 6 = 0", "x = -2")
    assert r.status == ValidationStatus.NOT_EQUIVALENT, r.detail


def test_unparseable_stem_is_not_verified() -> None:
    r = validate_question_answer("Solve for x: ???", "x = 1")
    assert r.status == ValidationStatus.NOT_VERIFIED
