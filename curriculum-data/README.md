# curriculum-data

Source of truth for all GoMaths learning content.

See [`docs/Curriculum_Content_Plan.md`](../docs/Curriculum_Content_Plan.md) for the full plan.

## Layout

```
curriculum-data/
└── grade-9/
    ├── numbers/
    ├── algebra/
    │   └── solving-linear-equations/
    │       ├── lesson.md
    │       ├── questions.json
    │       └── metadata.json
    ├── geometry/
    ├── measurement/
    └── data-handling/
```

## Asset spec

Each topic directory contains exactly three files:

- `lesson.md` — explanation + worked examples (markdown, math via `$...$` LaTeX)
- `questions.json` — practice question bank (schema in `docs/Curriculum_Content_Plan.md §3.3`)
- `metadata.json` — topic ID, prerequisites, CAPS reference (schema in `docs/Curriculum_Content_Plan.md §3.2`)

## Authoring workflow

One topic = one PR. Required checks (see `.github/workflows/curriculum-validate.yml` once added):

- JSON schema validation
- LaTeX renders cleanly
- SymPy verifies every computable answer
- Two specialist reviewers
- Curriculum Lead sign-off

## Validating answers locally

```sh
pip install sympy
python curriculum-data/scripts/validate_curriculum.py
```

Runs every `questions.json` answer through the SymPy validator in `services/ai-services/validation/`. Wired into CI via `.github/workflows/ci.yml`.

## Status

One example topic scaffolded: `grade-9/algebra/solving-linear-equations/`. Authoring at scale begins Week 1 of Phase 1 build (see `docs/Phase1_Launch_Plan.md §6`).

## Licensing

All content here is GoMaths IP unless explicitly noted in `LICENSES.md`. Do not import copyrighted textbook material verbatim.
