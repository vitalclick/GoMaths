"""
SymPy-driven equation solver for the scan pipeline.

Input: a LaTeX (or LaTeX-ish) string from OCR.
Output: ordered (explanation, math) steps and a final answer string.

We deliberately keep the solver narrow:
  - Linear / quadratic / cubic equations in one variable
  - Numeric expression simplification (no equals sign)
  - Anything else returns accepted=False rather than guessing

That conservativeness matters: a wrong "solution" shown to a learner is
worse than a polite "I can't solve this one — try a different image."
"""

from __future__ import annotations

import re
from dataclasses import dataclass

import sympy
from sympy import Eq, S, latex, simplify, solveset
from sympy.parsing.sympy_parser import (
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

_TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application,)


@dataclass(frozen=True)
class SolveStep:
    explanation: str
    math: str


@dataclass(frozen=True)
class SolveResult:
    accepted: bool
    final_answer: str | None
    steps: list[SolveStep]
    detail: str = ""


def solve_latex(latex_input: str) -> SolveResult:
    """Solve an OCR'd LaTeX-ish equation. Returns step-wise output."""
    if not latex_input.strip():
        return SolveResult(False, None, [], "empty input")

    normalised = _normalise(latex_input)

    if "=" in normalised:
        return _solve_equation(normalised)
    return _simplify_expression(normalised)


def _normalise(s: str) -> str:
    """Strip the LaTeX-isms SymPy doesn't accept and unify the operators."""
    # Drop dollar delimiters, \\, and common LaTeX wrappers.
    s = s.replace("$", "").replace("\\\\", " ")
    s = re.sub(r"\\(left|right)", "", s)
    s = re.sub(r"\\(cdot|times)", "*", s)
    s = re.sub(r"\\(div)", "/", s)
    s = re.sub(r"\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}", r"((\1)/(\2))", s)
    s = re.sub(r"\\sqrt\s*\{([^{}]+)\}", r"sqrt(\1)", s)
    # ^ stays as-is; sympy parser accepts it after we swap to **.
    s = s.replace("^", "**")
    # Drop remaining backslash macros.
    s = re.sub(r"\\[a-zA-Z]+", "", s)
    return s.strip()


def _parse(expr: str) -> sympy.Expr | None:
    try:
        return parse_expr(expr.strip(), evaluate=True, transformations=_TRANSFORMATIONS)
    except (SyntaxError, TypeError, sympy.SympifyError, ValueError):
        return None


def _solve_equation(s: str) -> SolveResult:
    lhs_str, _, rhs_str = s.partition("=")
    lhs = _parse(lhs_str)
    rhs = _parse(rhs_str)
    if lhs is None or rhs is None:
        return SolveResult(False, None, [], "couldn't parse one side")

    symbols = sorted(lhs.free_symbols.union(rhs.free_symbols), key=lambda x: x.name)
    if len(symbols) != 1:
        return SolveResult(False, None, [], f"need exactly 1 unknown, found {len(symbols)}")
    var = symbols[0]

    try:
        sol_set = solveset(Eq(lhs, rhs), var, domain=S.Complexes)
        solutions = sorted(sol_set, key=str)
    except (NotImplementedError, ValueError, TypeError) as exc:
        return SolveResult(False, None, [], f"solveset failed: {exc}")
    except Exception as exc:  # noqa: BLE001 — defensive
        return SolveResult(False, None, [], f"unexpected: {exc}")

    if not solutions:
        return SolveResult(False, None, [], "no solutions found")

    steps: list[SolveStep] = []
    diff = simplify(lhs - rhs)
    steps.append(
        SolveStep(
            explanation="Move everything to one side so the equation equals zero.",
            math=f"{latex(diff)} = 0",
        )
    )
    if hasattr(diff, "as_poly") and diff.as_poly(var) is not None:
        factored = sympy.factor(diff)
        if factored != diff:
            steps.append(
                SolveStep(
                    explanation="Factor the expression.",
                    math=f"{latex(factored)} = 0",
                )
            )
    for sol in solutions:
        steps.append(
            SolveStep(
                explanation=f"This gives {var} =",
                math=f"{latex(var)} = {latex(sol)}",
            )
        )

    if len(solutions) == 1:
        final = f"{var} = {sympy.nsimplify(solutions[0])}"
    else:
        joined = " or ".join(f"{var} = {sympy.nsimplify(sol)}" for sol in solutions)
        final = joined
    return SolveResult(accepted=True, final_answer=final, steps=steps)


def _simplify_expression(s: str) -> SolveResult:
    expr = _parse(s)
    if expr is None:
        return SolveResult(False, None, [], "couldn't parse")

    simplified = simplify(expr)
    steps = [
        SolveStep(
            explanation="Apply simplification rules.",
            math=f"{latex(expr)} = {latex(simplified)}",
        )
    ]
    return SolveResult(
        accepted=True,
        final_answer=str(sympy.nsimplify(simplified)),
        steps=steps,
    )
