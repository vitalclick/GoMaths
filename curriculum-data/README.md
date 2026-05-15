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

## Status
Empty. Authoring begins Week 1 of MVP build (see `docs/MVP_Spec.md §6`).

## Licensing
All content here is GoMaths IP unless explicitly noted in `LICENSES.md`. Do not import copyrighted textbook material verbatim.
