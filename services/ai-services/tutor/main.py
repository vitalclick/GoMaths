"""
AI Tutor service.

Pipeline for each /chat request:

  1. Build messages: system prompt + curriculum context (if topic_id) + user turn.
  2. Call the configured LLMProvider.
  3. Extract verifiable claims from the reply (regex first-pass).
  4. Run each claim through the SymPy validator.
  5. Return `validated=True` iff ALL extracted claims verified, OR none were
     found (the reply was pure prose — we can't lie about validation, so we
     return False to be conservative in that case too).

Phase 1 must:
  - Replace MockProvider via TUTOR_PROVIDER env (see providers.py).
  - Pass real curriculum context into the system prompt.
  - Add per-student conversation history.
  - Add rate limiting + abuse detection.
"""

from __future__ import annotations

import os
from fastapi import FastAPI
from pydantic import BaseModel

from .claims import extract_claims
from .providers import TutorMessage, get_provider
from validation.sympy_validator import validate_equivalent

app = FastAPI(title="GoMaths AI Tutor", version="0.0.1")
_provider = get_provider()


SYSTEM_PROMPT = (
    "You are Maya, a friendly maths tutor for South African Grade 9 learners "
    "(ages 14–15). You explain concepts step by step, use plain language, and "
    "encourage the learner. Show your working. Never make up answers — if "
    "you're not sure, say so. Use British English spellings."
)


class ChatRequest(BaseModel):
    student_id: str
    message: str
    topic_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    validated: bool
    provider: str
    extracted_claims: int
    verified_claims: int


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "tutor",
        "provider": _provider.name,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    messages: list[TutorMessage] = [
        TutorMessage(role="system", content=SYSTEM_PROMPT),
    ]
    if req.topic_id:
        messages.append(
            TutorMessage(
                role="system",
                content=(
                    f"The learner is currently working on topic '{req.topic_id}'. "
                    "Tailor explanations to that topic when relevant."
                ),
            )
        )
    messages.append(TutorMessage(role="user", content=req.message))

    reply = _provider.complete(messages)

    # Validate any mathematical claims in the reply.
    claims = extract_claims(reply.text)
    verified = 0
    for c in claims:
        r = validate_equivalent(c.stem, c.answer)
        if r.ok:
            verified += 1

    # Conservative `validated` flag: every claim we extracted must verify.
    # If no claims were extracted, we cannot claim verification.
    fully_validated = bool(claims) and verified == len(claims)

    return ChatResponse(
        reply=reply.text,
        validated=fully_validated,
        provider=reply.provider,
        extracted_claims=len(claims),
        verified_claims=verified,
    )
