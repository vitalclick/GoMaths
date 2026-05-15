# Contributing to GoMaths

This is a working contributor guide for engineers and curriculum specialists. For the project's vision, scope, and ADRs, see [`docs/`](./docs).

> **Branch policy**: never push directly to `main`. Every change goes through a PR.

---

## Getting started

If this is your first time on the repo, follow the **First-install checklist** in [`README.md`](./README.md). It walks through `pnpm install`, generating the API client, bringing up Postgres + Redis, seeding curriculum, and getting the Student app on screen. Don't skip it — most "weird errors" on day 1 are install drift.

---

## PR workflow (engineering)

### Branch naming

```
feature/<short-slug>     new functionality
fix/<short-slug>         bug fix
chore/<short-slug>       infra / build / docs
curriculum/<topic-id>    new lesson or question bank (see below)
```

### Commit messages

Subject line ≤ 70 chars, imperative mood ("add X", not "added X"). Body explains the **why**. Examples in `git log` already — copy the shape.

### PR description must include

- **What** changed, in plain language
- **Why** — the user-visible problem or the architectural reason
- **How** to verify, including commands the reviewer can paste
- **Risks** + how they're mitigated
- **Migration notes** if anything is data-shape, env, or infra

### Review expectations

- One approval minimum; two for anything touching auth, payments, curriculum, or migrations
- The reviewer's job is to find the thing the author missed, not to rubber-stamp
- Pushback on speculative complexity is welcome — "do we need this now?" is a legitimate review comment

### Tests

- New backend logic → a `*.spec.ts` covering at least the happy path + one error path
- New AI-services logic → pytest in the same directory
- New UI screen → ideally a Playwright test in `e2e/`; at minimum a smoke screenshot
- **Math-bearing changes** (anything that touches `validation/`, `solver/`, or curriculum content) require the SymPy validator to be run as part of CI — already wired

### CI

Four jobs run on every PR. Today three are blocking, one is informational:

- **Python** (blocking) — `pytest -v` over `services/ai-services/`
- **Curriculum** (blocking) — `validate_curriculum.py` over every authored answer
- **Node** (blocking) — `package.json` sanity for now; the full install + typecheck + lint + format + codegen check turns back on after the first lockfile commit (see `README.md §3`)
- **E2E** (currently skipped) — Playwright happy path; gated on the same lockfile commit

If your PR adds a real `pnpm-lock.yaml` and a real generated `api-client/src/generated.ts`, **flip the four `if: ${{ false }}` guards in `.github/workflows/ci.yml`** in the same PR.

---

## Curriculum PR workflow

Authored by SACE-registered curriculum specialists. Reviewed by a second specialist + the curriculum editor.

### Anatomy of a topic

Every topic is a directory under `curriculum-data/grade-<n>/<area>/<slug>/` with exactly three files:

```
solving-linear-equations/
├── metadata.json     topic id, title, grade, CAPS ref, learning outcomes
├── questions.json    practice questions with SymPy-verifiable answers
└── lesson.md         the lesson body in CommonMark + LaTeX
```

Schemas live in [`docs/Curriculum_Content_Plan.md §3`](./docs/Curriculum_Content_Plan.md).

### Authoring a brand-new topic (the workflow you'd use for topic #3)

Suggested next topic: **Pythagoras' theorem** (Grade 9, Space and Shape).
Below is the full step-by-step you'd follow.

#### 1. Create the directory

```sh
mkdir -p curriculum-data/grade-9/geometry/pythagoras-theorem
cd curriculum-data/grade-9/geometry/pythagoras-theorem
```

#### 2. Write `metadata.json`

Topic id pattern: `g<grade>.<area>.<short-name>`.

```json
{
  "topicId": "g9.geo.pythagoras",
  "title": "Pythagoras' Theorem",
  "grade": 9,
  "contentArea": "space_and_shape",
  "capsReference": "Term 3, Topic 3.2",
  "prerequisites": ["g9.alg.exponents"],
  "learningOutcomes": [
    "State Pythagoras' theorem for a right-angled triangle",
    "Find the hypotenuse given the two shorter sides",
    "Find a shorter side given the hypotenuse and the other shorter side",
    "Recognise common Pythagorean triples (3-4-5, 5-12-13)"
  ],
  "estimatedMinutes": 30
}
```

#### 3. Write `questions.json`

Two shapes the SymPy validator handles today:

- **Solve-for-x**: stem is an equation, e.g. `"c^2 = 3^2 + 4^2"`, answer `"c = 5"`. The validator solves and checks. Pythagoras questions naturally fit this shape — set up the equation explicitly.
- **Expression simplification**: stem has no `=`, e.g. `"sqrt(3^2 + 4^2)"`, answer `"5"`.

Anything else (word problems, geometry-from-diagram, multi-part) returns `NOT_VERIFIED` from the validator — which is **not** a failure, but it does mean a second specialist must hand-verify before merge.

Minimal first cut for Pythagoras (12 questions to start; full bank is 15 per `docs/Curriculum_Content_Plan.md §2`):

```json
{
  "topicId": "g9.geo.pythagoras",
  "questions": [
    {
      "id": "g9.geo.pythagoras.q001",
      "difficulty": "easy",
      "stem": "c^2 = 3^2 + 4^2",
      "answer": "c = 5 or c = -5",
      "answerLatex": "c = 5",
      "solutionSteps": [
        "Compute the squares: 9 + 16 = 25",
        "So c^2 = 25",
        "Take the positive root (length is positive): c = 5"
      ],
      "commonMistakes": [
        "Forgetting that c is a length, so we keep the positive root only",
        "Adding the sides themselves rather than squaring first"
      ],
      "tags": ["pythagoras", "find-hypotenuse"]
    }
  ]
}
```

A note on negative roots: the validator returns both roots from `solveset`. For "find a length" questions, write the `answer` as `"c = 5 or c = -5"` — the validator accepts this and the UI surfaces the positive root via `answerLatex`. The `lesson.md` explains why we discard the negative root.

#### 4. Write `lesson.md`

Use `$...$` for inline math, `$$...$$` for display. Aim for 200–400 words plus 2–3 worked examples.

```md
# Pythagoras' Theorem

In a right-angled triangle, if the two shorter sides are $a$ and $b$
and the hypotenuse (the longest side, opposite the right angle) is
$c$, then:

$$a^2 + b^2 = c^2$$

… (and so on)
```

#### 5. Validate locally

```sh
# From the repo root
python curriculum-data/scripts/validate_curriculum.py
```

Expected output:

```
[PASS] curriculum-data/grade-9/geometry/pythagoras-theorem/questions.json  (12/12 verified)
[PASS] curriculum-data/grade-9/algebra/laws-of-exponents/questions.json  (5/5 verified)
[PASS] curriculum-data/grade-9/algebra/solving-linear-equations/questions.json  (2/2 verified)

Summary: 3 topics, 19 questions, 0 failed
```

If anything's `NOT_VERIFIED` you can't shake out via SymPy, decide:

- Restructure the stem so it IS an equation (often possible — Pythagoras almost always reduces to "$c^2 = ...$")
- Or accept human-review-only, flag the question with a `"validatorExempt": true` field (Phase 1 schema addition — until then, leave a `// NOTE:` in the PR description)

#### 6. Peer review (4-eye rule)

PR is reviewed by the **second specialist** (mathematical correctness, age-appropriateness, common-mistakes coverage) and the **curriculum editor** (language, consistency, formatting).

Required CI green: `Python` + `Curriculum`. Author can self-merge once both reviewers approve.

#### 7. Add to the app's bundled fixtures (optional)

The Student app falls back to bundled fixtures when offline. To include the new topic in that fallback, copy the three files into `apps/student/fixtures/`:

```sh
cp curriculum-data/grade-9/geometry/pythagoras-theorem/metadata.json \
   apps/student/fixtures/g9.geo.pythagoras.metadata.json
cp curriculum-data/grade-9/geometry/pythagoras-theorem/questions.json \
   apps/student/fixtures/g9.geo.pythagoras.questions.json
# Wrap the markdown in a TS export, mirroring the existing two:
cat > apps/student/fixtures/g9.geo.pythagoras.lesson.ts <<EOF
export default \`$(cat curriculum-data/grade-9/geometry/pythagoras-theorem/lesson.md | sed 's/\`/\\\`/g')\`;
EOF
```

Then register it in `apps/student/lib/curriculum.ts` (the `FIXTURES` array).

In production, this step disappears — the backend serves from Prisma after `prisma:seed` runs.

---

## Code style

- TypeScript: 2-space indent, no semicolons reasonable in JSX, double-quoted strings everywhere else. Prettier is configured; format on save.
- Python: ruff-formatted, 100-char line limit, type hints required on public functions.
- Comments: only when the **why** isn't obvious from the code. Don't narrate what; document workarounds, invariants, and decisions.

---

## Reporting bugs

Open an issue with:

- Steps to reproduce
- What you expected
- What happened
- Environment (app version, platform, backend URL)
- For tutor issues: the conversation id (visible in dev tools / Developer mode)

For anything **POPIA-relevant** (a learner saw someone else's data, a deletion request was missed, etc.) — page the Information Officer first (`DEPLOYMENT_INFO.md §9`), then open the issue.

---

## Questions

- Architecture: read [`docs/Architecture_Decisions.md`](./docs/Architecture_Decisions.md) first; if it's not answered there, raise it in `#engineering` Slack and an ADR will be written.
- Curriculum: ask the Head of Curriculum (per `DEPLOYMENT_INFO.md §11`).
- Pilot school questions: route through the Product Manager.
