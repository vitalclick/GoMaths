# Curriculum rollback

A bad lesson or question reached production. Either:
- The lesson explanation is wrong / misleading
- A question's `answer` is wrong (the SymPy validator should catch this in CI — if it didn't, that's also a bug we need to write up)
- The `lessonMarkdown` renders incorrectly on a specific platform

Goal: revert quickly, communicate honestly, prevent recurrence.

---

## 1. Confirm

Don't roll back on one report — confirm first.

```sh
# Pull the offending question/topic from production
psql "$DATABASE_URL" -c \
  "SELECT id, stem, answer, \"answerLatex\"
     FROM \"Question\" WHERE id = '<question-id>';"

# Run the validator against it locally
cd services/ai-services
python -c "
from validation.sympy_validator import validate_question_answer
r = validate_question_answer('<stem>', '<answer>')
print(r)
"
```

If the validator returns `NOT_EQUIVALENT`, the question is genuinely wrong. If it returns `NOT_VERIFIED` (e.g. word problem), get a second specialist's read before acting.

## 2. Roll back

Curriculum lives in `curriculum-data/` and is loaded into the DB via `prisma:seed`. Two paths to revert:

### Fast path — revert the PR

```sh
git checkout main
git revert <bad-commit-sha>   # use --no-edit if the revert is mechanical
git push origin main
```

CI re-deploys; the deploy step's post-migration `pnpm prisma:seed` re-runs against the reverted content. The seed is idempotent — it upserts the prior version and replaces the question bank for the topic.

Time-to-revert from confirmation: ~5–10 minutes.

### Hot path — DB-only patch when waiting for CI is too slow

```sh
# Edit the bad question directly. Keep a record of the change so it
# gets folded back into curriculum-data/ via a follow-up PR.
psql "$DATABASE_URL" -c \
  "UPDATE \"Question\"
     SET answer = '<corrected>', \"answerLatex\" = '<corrected>'
     WHERE id = '<question-id>';"
```

Then **open the PR** to fix `curriculum-data/.../questions.json` before end of day. If you skip the PR, the next deploy's seed will overwrite your patch with the still-broken file.

## 3. Identify learner exposure

```sh
psql "$DATABASE_URL" -c "
  SELECT COUNT(DISTINCT s.\"userId\") AS students_affected
  FROM \"ProgressEvent\" pe
  JOIN \"Student\" s ON s.id = pe.\"studentId\"
  WHERE pe.\"questionId\" = '<question-id>'
    AND pe.\"occurredAt\" > NOW() - INTERVAL '30 days';"
```

If the result is 0: no learner saw the bad question (it was caught fast). Note in the postmortem and stop.

If non-zero: every affected learner deserves a heads-up via their school's primary contact. Build the list:

```sh
psql "$DATABASE_URL" -c "
  SELECT DISTINCT u.email, sch.name AS school
  FROM \"ProgressEvent\" pe
  JOIN \"Student\" s ON s.id = pe.\"studentId\"
  JOIN \"User\" u ON u.id = s.\"userId\"
  LEFT JOIN \"School\" sch ON sch.id = s.\"schoolId\"
  WHERE pe.\"questionId\" = '<question-id>';"
```

Honest comms to schools (template):
> Yesterday a small number of learners worked on a Grade 9 algebra
> question where our system marked the wrong answer as correct
> (and vice versa). We've corrected it. The affected question was
> "<stem>". Five minutes of teacher time to walk through the correct
> answer with the class would fix any lingering confusion. We're
> sorry — and grateful you caught it.

## 4. Postmortem-specific questions

- **How did this get past the SymPy validator in CI?** `validate_curriculum.py` runs on every PR (the `curriculum` GitHub Actions job). Either the question was a shape the validator returns `NOT_VERIFIED` on (e.g. a word problem, geometry diagram), or the validator was bypassed. Both need addressing.
- **Could a teacher have flagged this sooner?** Phase 1 should ship a "flag this question" button on the practice screen that creates an internal ticket.
- **Should this question be `NOT_VERIFIED` by design, and therefore require a second human reviewer at authoring time?** If so, encode that rule in the authoring template (per `docs/Curriculum_Content_Plan.md §4.2`).

## 5. Closing the loop

- Update the curriculum file (if you took the hot path, this is mandatory).
- Add the bad-question case as a regression test if it's mechanical (e.g. extend `validate_curriculum.py` to also check a new property).
- Tabletop this runbook with the curriculum team during their next monthly review.
