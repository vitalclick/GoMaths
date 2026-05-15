"""Tests for the claim extractor."""

from tutor.claims import extract_claims


def test_extracts_simple_equation() -> None:
    claims = extract_claims("To solve, x = 4.")
    raws = [c.raw for c in claims]
    assert any("x = 4" in r for r in raws)


def test_extracts_multiple_distinct_equations() -> None:
    text = "First step: 2x = 8. Then dividing by 2: x = 4."
    claims = extract_claims(text)
    raws = " ".join(c.raw for c in claims)
    assert "2x = 8" in raws or "2x  = 8" in raws
    assert "x = 4" in raws


def test_no_equations_returns_empty() -> None:
    assert extract_claims("Linear equations can be tricky at first.") == []
