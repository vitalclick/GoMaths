"""
AI Tutor service — FastAPI shell.

Phase 0 scaffold: exposes a health endpoint and a stub /chat endpoint that
returns a placeholder response. Phase 1 wires the LLM provider (decision in
ADR-005 pending) and re-validates every numeric answer through the
validation package before returning.
"""

from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="GoMaths AI Tutor", version="0.0.1")


class ChatRequest(BaseModel):
    student_id: str
    message: str
    topic_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    validated: bool


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "tutor"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    # TODO: Phase 1 — call LLM provider (per ADR-005), pass curriculum context
    #       for `topic_id`, then validate any numeric/algebraic claims via
    #       validation.sympy_validator before returning.
    return ChatResponse(
        reply=(
            f"(scaffold) tutor would answer: {req.message!r}. "
            "Wiring blocked on ADR-005 (LLM provider choice)."
        ),
        validated=False,
    )
