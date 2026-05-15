"""
AI Solver service — FastAPI shell.

Phase 0 scaffold: exposes a health endpoint and a stub /solve endpoint that
accepts a LaTeX expression and returns a placeholder. Phase 1 pipeline:

  image -> MathPix OCR -> LaTeX -> SymPy solver -> KaTeX-renderable steps

Rejects unparseable input. Never guesses.
"""

from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="GoMaths AI Solver", version="0.0.1")


class SolveRequest(BaseModel):
    latex: str


class SolveStep(BaseModel):
    explanation: str
    math: str


class SolveResponse(BaseModel):
    accepted: bool
    final_answer: str | None
    steps: list[SolveStep]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "solver"}


@app.post("/solve", response_model=SolveResponse)
def solve(req: SolveRequest) -> SolveResponse:
    # TODO: Phase 1 — parse req.latex into a SymPy expression, route to
    #       linear/quadratic/general solver, produce stepwise output, run
    #       through validation.sympy_validator before returning.
    return SolveResponse(
        accepted=False,
        final_answer=None,
        steps=[
            SolveStep(
                explanation="(scaffold) solver pipeline not yet implemented",
                math=req.latex,
            )
        ],
    )
