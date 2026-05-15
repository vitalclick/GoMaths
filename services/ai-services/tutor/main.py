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

import json
from collections.abc import Iterator

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
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


class HistoryTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    student_id: str
    message: str
    topic_id: str | None = None
    history: list[HistoryTurn] = []


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


def _build_messages(req: ChatRequest) -> list[TutorMessage]:
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

    # Prior turns from the persisted conversation. Already trimmed by the
    # backend to a sane context window.
    for turn in req.history:
        if turn.role not in ("user", "assistant"):
            continue
        messages.append(TutorMessage(role=turn.role, content=turn.content))

    messages.append(TutorMessage(role="user", content=req.message))
    return messages


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    messages = _build_messages(req)
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


def _sse(event: str, data: dict) -> str:
    """Format an event for the SSE stream — `event:` line + `data:` line + blank."""
    return f"event: {event}\ndata: {json.dumps(data, separators=(',', ':'))}\n\n"


def _stream_events(req: ChatRequest) -> Iterator[bytes]:
    """
    Stream the tutor reply token-by-token over SSE.

    Event types:
      - `delta`        — { text }                       (zero or more)
      - `claim`        — { raw, stem, answer, ok }      (zero or more, as
                         the validator confirms or rejects an equation
                         that just finished streaming)
      - `done`         — { reply, validated, provider, model,
                          extracted_claims, verified_claims, tokens... }
      - `error`        — { message }

    Incremental validation: every time the accumulated text crosses an
    equation boundary we haven't seen yet, we run the SymPy validator on
    it and emit a `claim` event so the UI can show inline ticks as Maya
    "shows her working". The summary `done` event still arrives last.
    """
    messages = _build_messages(req)
    try:
        accumulated = ""
        final = None
        seen_claims: set[str] = set()
        verified_count = 0
        total_claims = 0

        for chunk in _provider.stream(messages):
            if chunk.done:
                final = chunk.final
                break
            accumulated += chunk.text
            yield _sse("delta", {"text": chunk.text}).encode()

            # Re-extract on every chunk; cheap (regex). Anything new gets
            # validated and emitted as a `claim` event exactly once.
            for c in extract_claims(accumulated):
                if c.raw in seen_claims:
                    continue
                seen_claims.add(c.raw)
                total_claims += 1
                ok = validate_equivalent(c.stem, c.answer).ok
                if ok:
                    verified_count += 1
                yield _sse(
                    "claim",
                    {"raw": c.raw, "stem": c.stem, "answer": c.answer, "ok": ok},
                ).encode()

        # Re-scan the full final text for anything the chunk loop missed
        # (it can happen when a delimiter straddles two chunks).
        full_text = final.text if final else accumulated
        for c in extract_claims(full_text):
            if c.raw in seen_claims:
                continue
            seen_claims.add(c.raw)
            total_claims += 1
            ok = validate_equivalent(c.stem, c.answer).ok
            if ok:
                verified_count += 1
            yield _sse(
                "claim",
                {"raw": c.raw, "stem": c.stem, "answer": c.answer, "ok": ok},
            ).encode()

        fully_validated = bool(total_claims) and verified_count == total_claims

        yield _sse(
            "done",
            {
                "reply": full_text,
                "validated": fully_validated,
                "provider": final.provider if final else _provider.name,
                "model": final.model if final else "",
                "extracted_claims": total_claims,
                "verified_claims": verified_count,
                "input_tokens": final.input_tokens if final else 0,
                "output_tokens": final.output_tokens if final else 0,
                "cached_tokens": final.cached_tokens if final else 0,
            },
        ).encode()
    except Exception as exc:  # noqa: BLE001 — surface failures over the wire
        yield _sse("error", {"message": str(exc)}).encode()


@app.post("/chat/stream")
def chat_stream(req: ChatRequest) -> StreamingResponse:
    return StreamingResponse(
        _stream_events(req),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
