# ai-services

Python FastAPI microservices — the AI brain of GoMaths.

## Services (MVP)

### `tutor/`

Chat-based AI tutor. GPT-4-class LLM behind an abstraction (so we can swap providers).

- Curriculum-grounded system prompt
- Conversation history persisted via `backend-api`
- **Every numeric/algebraic answer in a response is re-validated by SymPy before being returned.** If validation fails, the service either retries with a corrective prompt or surfaces the curriculum's worked solution.

### `solver/`

Scan solver pipeline:

```
image → MathPix OCR → LaTeX → SymPy solver → steps → KaTeX-renderable response
```

Rejects unparseable input gracefully. Does NOT guess.

### `validation/`

Shared SymPy-based answer verifier. Used by `tutor`, `solver`, and the curriculum authoring pipeline (CI checks that `questions.json` answers are mathematically consistent).

## Stack

- Python 3.11+
- FastAPI
- SymPy
- MathPix client
- OpenAI / Anthropic SDKs (behind an LLM abstraction)
- Pydantic for I/O schemas

## Out of scope (MVP)

- Adaptive learning engine (Phase 2)
- Recommendation system (Phase 2)
- Voice tutor (Phase 3)
- Handwriting OCR (Phase 3)

## Status

Not yet scaffolded. Initialise per-service after MVP kickoff:

```
ai-services/
├── tutor/
├── solver/
├── validation/
└── shared/
```
