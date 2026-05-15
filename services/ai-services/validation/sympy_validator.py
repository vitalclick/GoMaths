"""
SymPy-based validation of mathematical answers.

This module is provider-agnostic: it does not depend on any LLM. Every numeric
or algebraic answer produced by the AI tutor or AI solver, and every answer
authored in the curriculum question bank, is verified through this layer
before being shown to a learner.

Two entry points:

  - validate_equivalent(a, b): are two expressions mathematically equivalent?
  - validate_question_answer(stem, answer): is `answer` correct for `stem`?

The validator is intentionally conservative:
  - Anything it cannot parse returns NOT_VERIFIED (never falsely accepts).
  - Equation-shaped answers ("x = 4") are normalized before comparison.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

import sympy
from sympy import Eq, S, Symbol, simplify, solveset, sympify
from sympy.parsing.sympy_parser import parse_expr


class ValidationStatus(str, Enum):
    EQUIVALENT = "equivalent"
    NOT_EQUIVALENT = "not_equivalent"
    NOT_VERIFIED = "not_verified"


@dataclass(frozen=True)
class ValidationResult:
    status: ValidationStatus
    detail: str = ""

    @property
    def ok(self) -> bool:
        return self.status == ValidationStatus.EQUIVALENT


def _parse(expr: str) -> sympy.Expr | None:
    """Parse a string into a SymPy expression, returning None on failure."""
    try:
        return parse_expr(expr.strip(), evaluate=True)
    except (SyntaxError, TypeError, sympy.SympifyError, ValueError):
        return None


def _split_assignment(expr: str) -> tuple[str, str] | None:
    """If expr looks like 'x = 4', return ('x', '4'); else None."""
    if "=" not in expr:
        return None
    lhs, _, rhs = expr.partition("=")
    return lhs.strip(), rhs.strip()


def validate_equivalent(candidate: str, reference: str) -> ValidationResult:
    """
    Check whether two answers are mathematically equivalent.

    Handles:
      - bare numeric/algebraic expressions: "x + 1" vs "1 + x"
      - assignment forms: "x = 4" vs "x = 4.0"
      - set-valued answers: "x = -2, -3" vs "{-2, -3}"  (best-effort)
    """
    if candidate.strip() == reference.strip():
        return ValidationResult(ValidationStatus.EQUIVALENT, "string match")

    cand_assign = _split_assignment(candidate)
    ref_assign = _split_assignment(reference)

    if cand_assign and ref_assign:
        cand_var, cand_val = cand_assign
        ref_var, ref_val = ref_assign
        if cand_var != ref_var:
            return ValidationResult(
                ValidationStatus.NOT_EQUIVALENT,
                f"different variable: {cand_var} vs {ref_var}",
            )
        return _compare_expressions(cand_val, ref_val)

    return _compare_expressions(candidate, reference)


def _compare_expressions(a: str, b: str) -> ValidationResult:
    ea = _parse(a)
    eb = _parse(b)
    if ea is None or eb is None:
        return ValidationResult(ValidationStatus.NOT_VERIFIED, "parse failed")

    try:
        if simplify(ea - eb) == 0:
            return ValidationResult(ValidationStatus.EQUIVALENT, "simplify diff = 0")
    except (TypeError, ValueError):
        pass

    try:
        if ea.equals(eb):
            return ValidationResult(ValidationStatus.EQUIVALENT, "equals()")
    except (TypeError, ValueError, AttributeError):
        pass

    return ValidationResult(
        ValidationStatus.NOT_EQUIVALENT,
        f"{ea} != {eb}",
    )


def validate_question_answer(stem: str, answer: str) -> ValidationResult:
    """
    Verify that `answer` is correct for `stem`.

    Two question shapes are handled:

      1. **Equation-solving** — stem contains "=", e.g. "2x + 5 = 13".
         Answer is "x = 4" or "x = -2 or x = -3".

      2. **Expression simplification** — stem has no "=", e.g. "2^3 * 2^4"
         or "(x^3)^2". Answer is the simplified expression, optionally
         prefixed with "=" (e.g. "= 128", "2^7", "x^6").

    Returns NOT_VERIFIED for unparseable inputs; never silently accepts.
    """
    cleaned_stem = stem.replace("^", "**")
    if "=" not in cleaned_stem:
        return _validate_expression_simplification(cleaned_stem, answer)

    lhs_str, _, rhs_str = cleaned_stem.partition("=")
    lhs = _parse(lhs_str)
    rhs = _parse(rhs_str)
    if lhs is None or rhs is None:
        return ValidationResult(ValidationStatus.NOT_VERIFIED, "stem parse failed")

    symbols = sorted(lhs.free_symbols.union(rhs.free_symbols), key=lambda s: s.name)
    if len(symbols) != 1:
        return ValidationResult(
            ValidationStatus.NOT_VERIFIED,
            f"expected 1 unknown, found {len(symbols)}",
        )
    var: Symbol = symbols[0]

    try:
        true_solutions = solveset(Eq(lhs, rhs), var, domain=S.Complexes)
    except (NotImplementedError, ValueError, TypeError) as exc:
        return ValidationResult(ValidationStatus.NOT_VERIFIED, f"solveset failed: {exc}")

    claimed = _extract_claimed_values(answer, var.name)
    if not claimed:
        return ValidationResult(
            ValidationStatus.NOT_VERIFIED,
            "could not parse answer values",
        )

    parsed_claimed: list[sympy.Expr] = []
    for c in claimed:
        e = _parse(c)
        if e is None:
            return ValidationResult(
                ValidationStatus.NOT_VERIFIED,
                f"could not parse claimed value: {c}",
            )
        parsed_claimed.append(e)

    try:
        true_set = set(true_solutions)
    except TypeError:
        return ValidationResult(
            ValidationStatus.NOT_VERIFIED,
            "solution set not enumerable",
        )

    if set(parsed_claimed) == true_set:
        return ValidationResult(ValidationStatus.EQUIVALENT, "solution sets match")

    # Fall back to pairwise equivalence (handles e.g. "2.0" vs "2").
    if len(parsed_claimed) == len(true_set):
        matched = []
        true_list = list(true_set)
        for c in parsed_claimed:
            for t in true_list:
                if t not in matched and simplify(sympify(c) - sympify(t)) == 0:
                    matched.append(t)
                    break
        if len(matched) == len(true_list):
            return ValidationResult(ValidationStatus.EQUIVALENT, "pairwise match")

    return ValidationResult(
        ValidationStatus.NOT_EQUIVALENT,
        f"claimed {parsed_claimed} != true {sorted(true_set, key=str)}",
    )


def _validate_expression_simplification(stem: str, answer: str) -> ValidationResult:
    """
    Verify that `answer` is a simplified form of the expression `stem`.

    `stem` and `answer` are treated as expressions (no "="). The answer may
    optionally be written as "= 128" — the leading "=" is stripped.
    """
    cleaned_answer = answer.replace("^", "**").strip()
    if cleaned_answer.startswith("="):
        cleaned_answer = cleaned_answer[1:].strip()

    stem_expr = _parse(stem)
    answer_expr = _parse(cleaned_answer)
    if stem_expr is None or answer_expr is None:
        return ValidationResult(ValidationStatus.NOT_VERIFIED, "parse failed")

    try:
        if simplify(stem_expr - answer_expr) == 0:
            return ValidationResult(ValidationStatus.EQUIVALENT, "simplify diff = 0")
    except (TypeError, ValueError):
        pass

    try:
        if stem_expr.equals(answer_expr):
            return ValidationResult(ValidationStatus.EQUIVALENT, "equals()")
    except (TypeError, ValueError, AttributeError):
        pass

    return ValidationResult(
        ValidationStatus.NOT_EQUIVALENT,
        f"{stem_expr} != {answer_expr}",
    )


def _extract_claimed_values(answer: str, var_name: str) -> list[str]:
    """
    Pull the numeric/expression values out of an answer string like:
      "x = 4"                  -> ["4"]
      "x = -2 or x = -3"       -> ["-2", "-3"]
      "x = -2, x = -3"         -> ["-2", "-3"]
    """
    parts = answer.replace(" or ", ",").split(",")
    values: list[str] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        assignment = _split_assignment(part)
        if assignment is None:
            values.append(part)
        else:
            lhs, rhs = assignment
            if lhs != var_name:
                return []
            values.append(rhs)
    return values
