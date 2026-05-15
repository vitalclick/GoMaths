"""
GoMaths validation service — HTTP wrapper around sympy_validator.

Run with:

    uvicorn validation.main:app --host 0.0.0.0 --port 8003

The backend-api (NestJS) calls this service to verify student answers and
to verify tutor/solver responses before showing them to learners.
"""

from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from .sympy_validator import ValidationStatus, validate_equivalent, validate_question_answer

app = FastAPI(title="GoMaths Validation Service", version="0.0.1")


class ValidateRequest(BaseModel):
    stem: str
    answer: str


class EquivalentRequest(BaseModel):
    candidate: str
    reference: str


class ValidateResponse(BaseModel):
    status: str
    detail: str
    ok: bool


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "validation"}


@app.post("/validate", response_model=ValidateResponse)
def validate(req: ValidateRequest) -> ValidateResponse:
    """Verify that `answer` is correct for `stem`. Handles equation solving
    and expression simplification — see sympy_validator for details."""
    result = validate_question_answer(req.stem, req.answer)
    return ValidateResponse(
        status=result.status.value,
        detail=result.detail,
        ok=result.ok,
    )


@app.post("/equivalent", response_model=ValidateResponse)
def equivalent(req: EquivalentRequest) -> ValidateResponse:
    """Check whether two expressions/answers are mathematically equivalent."""
    result = validate_equivalent(req.candidate, req.reference)
    return ValidateResponse(
        status=result.status.value,
        detail=result.detail,
        ok=result.ok,
    )


# Expose enum values so the backend can type-check status strings.
@app.get("/statuses")
def statuses() -> list[str]:
    return [s.value for s in ValidationStatus]
