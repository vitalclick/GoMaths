"""
Extract verifiable mathematical claims from a tutor reply.

Phase 0 implementation is regex-based — it finds patterns like:
  - "x = 4"
  - "= 128"
  - "2 + 3 = 5"

and returns them as (stem, claimed_answer) pairs ready for the SymPy
validator. Phase 1 should extend this with an LLM-based extractor for
trickier cases (word-problem reasoning), but the regex baseline must
stay as the cheap-and-fast first pass.

The goal is not to be exhaustive — it's to catch the high-confidence
cases. A claim we can't extract is *not* the same as a claim we've
verified to be wrong. The tutor service surfaces `validated=False` when
we couldn't verify, and the UI shows that state honestly.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# Matches an equation like "2x + 5 = 13" or "x = 4". Constrained to keep
# the expression short and avoid runaway matches on prose.
EQUATION_PATTERN = re.compile(
    r"([A-Za-z0-9 \^*+\-/().]{1,40})\s*=\s*([A-Za-z0-9 \^*+\-/().]{1,40})"
)


@dataclass(frozen=True)
class Claim:
    raw: str
    stem: str
    answer: str


def extract_claims(text: str) -> list[Claim]:
    """Pull out verifiable equation-shaped claims from `text`."""
    claims: list[Claim] = []
    seen: set[str] = set()

    for match in EQUATION_PATTERN.finditer(text):
        raw = match.group(0).strip()
        if raw in seen:
            continue
        seen.add(raw)

        lhs = match.group(1).strip()
        rhs = match.group(2).strip()

        # Skip degenerate matches like " = " or single tokens.
        if not lhs or not rhs:
            continue
        if len(lhs) < 1 or len(rhs) < 1:
            continue

        # If the LHS is a single variable name, this is a solution claim:
        # treat the whole match as a solution to verify against context.
        # For now we hand the validator the LHS-as-stem and full match as
        # the answer, which exercises the validator's expression-equivalence
        # path.
        claims.append(Claim(raw=raw, stem=lhs, answer=rhs))

    return claims
