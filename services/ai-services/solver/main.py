"""
GoMaths AI Solver service.

Pipeline:
    image bytes  →  OCR (MathPix or Mock)  →  LaTeX
                 →  SymPy solver           →  step-wise solution

Run:
    uvicorn solver.main:app --port 8002

The OCR provider is chosen by SOLVER_OCR_PROVIDER (default: mock). The
mock returns a deterministic canned expression so the full pipeline can
be demoed end-to-end without a MathPix contract.
"""

from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

from .engine import SolveResult, SolveStep, solve_latex
from .providers import get_ocr_provider

app = FastAPI(title="GoMaths AI Solver", version="0.0.1")
_ocr = get_ocr_provider()


class SolveStepResponse(BaseModel):
    explanation: str
    math: str


class SolveResponse(BaseModel):
    accepted: bool
    final_answer: str | None
    steps: list[SolveStepResponse]
    detected_latex: str | None
    ocr_provider: str
    ocr_confidence: float | None = None
    detail: str = ""


class SolveTextRequest(BaseModel):
    """Skip OCR and solve a LaTeX string directly. Useful for tests."""

    latex: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "solver", "ocr_provider": _ocr.name}


@app.post("/solve", response_model=SolveResponse)
def solve_text(req: SolveTextRequest) -> SolveResponse:
    result = solve_latex(req.latex)
    return _to_response(result, detected_latex=req.latex)


@app.post("/scan", response_model=SolveResponse)
async def scan(image: UploadFile = File(...)) -> SolveResponse:
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="empty file")

    ocr = _ocr.recognise(image_bytes, content_type=image.content_type or "image/jpeg")
    if not ocr.accepted or not ocr.latex:
        return SolveResponse(
            accepted=False,
            final_answer=None,
            steps=[],
            detected_latex=None,
            ocr_provider=ocr.provider,
            ocr_confidence=ocr.confidence,
            detail=ocr.detail or "OCR did not produce a recognisable expression",
        )

    result = solve_latex(ocr.latex)
    return _to_response(
        result,
        detected_latex=ocr.latex,
        ocr_provider=ocr.provider,
        ocr_confidence=ocr.confidence,
    )


def _to_response(
    result: SolveResult,
    *,
    detected_latex: str | None,
    ocr_provider: str | None = None,
    ocr_confidence: float | None = None,
) -> SolveResponse:
    return SolveResponse(
        accepted=result.accepted,
        final_answer=result.final_answer,
        steps=[SolveStepResponse(explanation=s.explanation, math=s.math) for s in result.steps],
        detected_latex=detected_latex,
        ocr_provider=ocr_provider or _ocr.name,
        ocr_confidence=ocr_confidence,
        detail=result.detail,
    )
