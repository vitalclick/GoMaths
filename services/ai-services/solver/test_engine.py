"""Tests for the solver engine."""

from solver.engine import solve_latex


def test_solves_simple_linear_equation() -> None:
    r = solve_latex("2x + 5 = 13")
    assert r.accepted, r.detail
    assert r.final_answer is not None and "4" in r.final_answer
    assert len(r.steps) >= 1


def test_solves_quadratic_two_roots() -> None:
    r = solve_latex("x^2 + 5x + 6 = 0")
    assert r.accepted, r.detail
    assert r.final_answer is not None
    assert "-2" in r.final_answer and "-3" in r.final_answer


def test_simplifies_expression() -> None:
    r = solve_latex("2^3 * 2^4")
    assert r.accepted, r.detail
    assert r.final_answer is not None and "128" in r.final_answer


def test_rejects_unparseable_input() -> None:
    r = solve_latex("???")
    assert not r.accepted


def test_handles_latex_fraction() -> None:
    # \frac{x+1}{2} = 3  →  x = 5
    r = solve_latex(r"\frac{x+1}{2} = 3")
    assert r.accepted, r.detail
    assert r.final_answer is not None and "5" in r.final_answer
