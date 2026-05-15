"""
AI Tutor service.

Pipeline for each /chat request:

  1. Build messages: persona system block + curriculum context (when
     topic_id matches a loaded topic) + the user turn.
  2. Call the configured LLMProvider.
  3. Extract verifiable claims from the reply (regex first-pass).
  4. Run each claim through the SymPy validator.
  5. Return `validated=True` iff at least one claim was extracted AND
     every extracted claim verified.

Phase 1 should add:
  - Per-student conversation history (with token-budget eviction)
  - Rate limiting per student id (Redis-backed)
  - Streaming response support
  - Per-request observability (tokens, cache hit rate, latency)
"""

from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from .claims import extract_claims
from .curriculum import context_for_prompt, load_all
from .providers import TutorMessage, get_provider
from validation.sympy_validator import validate_equivalent

app = FastAPI(title="GoMaths AI Tutor", version="0.0.1")
_provider = get_provider()
_topics = load_all()


SYSTEM_PROMPT = (
    "You are Maya, a friendly maths tutor for South African Grade 9 learners "
    "(ages 14–15). You explain concepts step by step, use plain language, "
    "and encourage the learner. Show your working clearly. Use British "
    "English spellings. If you're uncertain about a numeric answer, say so "
    "rather than guessing — it's better to be honest than wrong. When asked "
    "to solve, walk through each step before giving the final answer."
)


class ChatRequest(BaseModel):
    student_id: str
    message: str
    topic_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    validated: bool
    provider: str
    model: str
    extracted_claims: int
    verified_claims: int
    input_tokens: int
    output_tokens: int
    cached_tokens: int


@app.get("/health")
def health() -> dict[str, str | int]:
    return {
        "status": "ok",
        "service": "tutor",
        "provider": _provider.name,
        "topics_loaded": len(_topics),
    }


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    messages: list[TutorMessage] = [TutorMessage(role="system", content=SYSTEM_PROMPT)]

    if req.topic_id and req.topic_id in _topics:
        # Inject lesson content as a separate system block. With Anthropic,
        # this is prompt-cached separately from the persona, so changing
        # topics doesn't invalidate the persona cache.
        messages.append(
            TutorMessage(
                role="system",
                content=context_for_prompt(_topics[req.topic_id]),
            )
        )
    elif req.topic_id:
        messages.append(
            TutorMessage(
                role="system",
                content=(
                    f"The learner is currently working on topic '{req.topic_id}' "
                    "(content not loaded). Use general Grade 9 CAPS knowledge."
                ),
            )
        )

    messages.append(TutorMessage(role="user", content=req.message))

    reply = _provider.complete(messages)

    # Validate any mathematical claims in the reply.
    claims = extract_claims(reply.text)
    verified = sum(1 for c in claims if validate_equivalent(c.stem, c.answer).ok)
    fully_validated = bool(claims) and verified == len(claims)

    return ChatResponse(
        reply=reply.text,
        validated=fully_validated,
        provider=reply.provider,
        model=reply.model,
        extracted_claims=len(claims),
        verified_claims=verified,
        input_tokens=reply.input_tokens,
        output_tokens=reply.output_tokens,
        cached_tokens=reply.cached_tokens,
    )
