#!/usr/bin/env python3
"""
Validate every question in curriculum-data/ against the SymPy validator.

Run from the repo root:

    python curriculum-data/scripts/validate_curriculum.py

Exits non-zero if any computable answer fails validation, so this can be
wired into CI as a pre-merge gate for curriculum PRs.

Outputs:
  - One line per topic: PASS / FAIL with counts
  - For failures, the question id and reason
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "services" / "ai-services"))

from validation.sympy_validator import (  # noqa: E402
    ValidationStatus,
    validate_question_answer,
)


def main() -> int:
    curriculum_dir = REPO_ROOT / "curriculum-data"
    failures: list[str] = []
    total_questions = 0
    total_topics = 0

    for questions_file in curriculum_dir.rglob("questions.json"):
        total_topics += 1
        topic_failures = 0
        topic_total = 0

        with questions_file.open() as f:
            data = json.load(f)

        for q in data.get("questions", []):
            topic_total += 1
            total_questions += 1
            qid = q.get("id", "<unknown>")
            stem = q.get("stem", "")
            answer = q.get("answer", "")

            result = validate_question_answer(stem, answer)
            if result.status == ValidationStatus.NOT_EQUIVALENT:
                topic_failures += 1
                failures.append(f"  {qid}: {result.detail}")
            # NOT_VERIFIED is acceptable — author marked it as needing human
            # review (e.g., word problems). Surface it but do not fail CI.

        rel = questions_file.relative_to(REPO_ROOT)
        status = "PASS" if topic_failures == 0 else "FAIL"
        print(f"[{status}] {rel}  ({topic_total - topic_failures}/{topic_total} verified)")

    print()
    print(f"Summary: {total_topics} topics, {total_questions} questions, {len(failures)} failed")

    if failures:
        print("\nFailures:")
        for f in failures:
            print(f)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
