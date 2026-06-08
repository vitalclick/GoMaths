"""
LLM provider abstraction.

Three implementations:

  - MockProvider — deterministic, no network. Used in tests and as the
    final fallback when nothing else is configured.
  - AnthropicProvider — production. Uses prompt caching on the system
    prompt + curriculum context for cost efficiency.
  - OpenAIProvider — alternative production path. Same interface.

Selection via env:

    TUTOR_PROVIDER=openai        # force OpenAI    (errors if no OPENAI_API_KEY)
    TUTOR_PROVIDER=anthropic     # force Anthropic (errors if no ANTHROPIC_API_KEY)
    TUTOR_PROVIDER=mock          # force mock
    TUTOR_PROVIDER=auto / unset  # auto-detect by which key is present:
                                 #   OPENAI_API_KEY    -> OpenAI
                                 #   ANTHROPIC_API_KEY -> Anthropic
                                 #   neither           -> mock

Production keys:
    OPENAI_API_KEY=sk-...
    ANTHROPIC_API_KEY=sk-ant-...

The provider abstraction is intentionally narrow: a `complete(messages)`
call that returns text. Streaming, tool use, and multi-turn caching state
belong in a Phase 1 expansion of this interface — keep it small until we
have a concrete need.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Iterator, Protocol


@dataclass(frozen=True)
class TutorMessage:
    role: str  # "system" | "user" | "assistant"
    content: str


@dataclass(frozen=True)
class TutorReply:
    text: str
    provider: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cached_tokens: int = 0


@dataclass(frozen=True)
class StreamChunk:
    """One delta from a streaming response. Final chunk has done=True."""

    text: str
    done: bool = False
    # Populated only on the final chunk.
    final: TutorReply | None = None


class LLMProvider(Protocol):
    name: str

    def complete(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> TutorReply:
        ...

    def stream(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> Iterator[StreamChunk]:
        ...


# ─── Mock ──────────────────────────────────────────────────────────────


class MockProvider:
    """Deterministic stand-in for tests/dev. No external calls."""

    name = "mock"

    def complete(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> TutorReply:
        last_user = next((m for m in reversed(messages) if m.role == "user"), None)
        user_text = (last_user.content if last_user else "").lower()

        if "hello" in user_text or "hi" in user_text:
            text = (
                "Hi! I'm Maya, your maths buddy. "
                "Tell me what topic you're working on and I'll help you step by step."
            )
        elif "solve" in user_text and "=" in user_text:
            text = (
                "To solve a linear equation, do the same thing to both sides. "
                "Move the constants to one side, the variables to the other, "
                "then divide by the coefficient of x. Want me to walk through "
                "your specific equation?"
            )
        elif "exponent" in user_text or "power" in user_text:
            text = (
                "The product law says: same base, multiplied → add the exponents. "
                "For example, 2^3 * 2^4 = 2^(3+4) = 2^7 = 128."
            )
        else:
            text = (
                "(mock tutor) I'd give a real answer here once the production LLM "
                "is wired up. For now I'm just echoing that your question was: "
                f"{(last_user.content if last_user else '')!r}"
            )

        return TutorReply(text=text, provider=self.name, model="mock-1")

    def stream(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> Iterator[StreamChunk]:
        # Stream the canned response word-by-word so tests can verify
        # accumulator behaviour in the consumers.
        final = self.complete(messages, max_tokens=max_tokens)
        words = final.text.split(" ")
        for i, w in enumerate(words):
            yield StreamChunk(text=w + (" " if i < len(words) - 1 else ""))
        yield StreamChunk(text="", done=True, final=final)


# ─── Anthropic ─────────────────────────────────────────────────────────


class AnthropicProvider:
    """
    Production Anthropic provider.

    Prompt caching is enabled on the system block (the persona + curriculum
    context). System content longer than ~1024 tokens hits the cache after
    the first request; subsequent requests with the same prefix are billed
    at 10% of normal input cost. See:
    https://docs.anthropic.com/claude/docs/prompt-caching

    Default model: claude-haiku-4-5 — strong at maths reasoning, cheap and
    fast enough for the tutor use case. Override with TUTOR_MODEL.
    """

    name = "anthropic"

    def __init__(self, api_key: str, model: str | None = None) -> None:
        # Imported lazily so MockProvider works without the anthropic SDK installed.
        from anthropic import Anthropic

        self._client = Anthropic(api_key=api_key)
        self.model = model or os.environ.get("TUTOR_MODEL", "claude-haiku-4-5")

    def complete(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> TutorReply:
        system_blocks = []
        conversation = []

        for m in messages:
            if m.role == "system":
                # Mark every system block as cacheable. Anthropic caches the
                # longest prefix that's identical to a recent request.
                system_blocks.append(
                    {"type": "text", "text": m.content, "cache_control": {"type": "ephemeral"}}
                )
            else:
                conversation.append({"role": m.role, "content": m.content})

        response = self._client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system_blocks if system_blocks else None,
            messages=conversation,
        )

        text = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        )
        usage = response.usage
        return TutorReply(
            text=text,
            provider=self.name,
            model=self.model,
            input_tokens=getattr(usage, "input_tokens", 0),
            output_tokens=getattr(usage, "output_tokens", 0),
            cached_tokens=(
                getattr(usage, "cache_read_input_tokens", 0)
                + getattr(usage, "cache_creation_input_tokens", 0)
            ),
        )

    def stream(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> Iterator[StreamChunk]:
        system_blocks, conversation = self._partition(messages)
        with self._client.messages.stream(
            model=self.model,
            max_tokens=max_tokens,
            system=system_blocks if system_blocks else None,
            messages=conversation,
        ) as stream:
            for delta in stream.text_stream:
                if delta:
                    yield StreamChunk(text=delta)
            final_message = stream.get_final_message()
            text = "".join(
                block.text for block in final_message.content if getattr(block, "type", None) == "text"
            )
            usage = final_message.usage
            yield StreamChunk(
                text="",
                done=True,
                final=TutorReply(
                    text=text,
                    provider=self.name,
                    model=self.model,
                    input_tokens=getattr(usage, "input_tokens", 0),
                    output_tokens=getattr(usage, "output_tokens", 0),
                    cached_tokens=(
                        getattr(usage, "cache_read_input_tokens", 0)
                        + getattr(usage, "cache_creation_input_tokens", 0)
                    ),
                ),
            )

    def _partition(self, messages: list[TutorMessage]) -> tuple[list[dict], list[dict]]:
        system_blocks: list[dict] = []
        conversation: list[dict] = []
        for m in messages:
            if m.role == "system":
                system_blocks.append(
                    {"type": "text", "text": m.content, "cache_control": {"type": "ephemeral"}}
                )
            else:
                conversation.append({"role": m.role, "content": m.content})
        return system_blocks, conversation


# ─── OpenAI ────────────────────────────────────────────────────────────


class OpenAIProvider:
    """
    Production OpenAI provider.

    Default model: gpt-4o-mini. OpenAI's prompt caching is automatic for
    requests above 1024 tokens of identical prefix — no `cache_control`
    needed. Override model with TUTOR_MODEL.
    """

    name = "openai"

    def __init__(self, api_key: str, model: str | None = None) -> None:
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key)
        self.model = model or os.environ.get("TUTOR_MODEL", "gpt-4o-mini")

    def complete(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> TutorReply:
        # OpenAI uses a flat messages array (no separate `system=` arg).
        wire_messages = [{"role": m.role, "content": m.content} for m in messages]

        response = self._client.chat.completions.create(
            model=self.model,
            messages=wire_messages,
            max_tokens=max_tokens,
        )

        text = response.choices[0].message.content or ""
        usage = response.usage
        return TutorReply(
            text=text,
            provider=self.name,
            model=self.model,
            input_tokens=getattr(usage, "prompt_tokens", 0) if usage else 0,
            output_tokens=getattr(usage, "completion_tokens", 0) if usage else 0,
            cached_tokens=(
                getattr(usage.prompt_tokens_details, "cached_tokens", 0)
                if usage and getattr(usage, "prompt_tokens_details", None)
                else 0
            ),
        )

    def stream(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> Iterator[StreamChunk]:
        wire_messages = [{"role": m.role, "content": m.content} for m in messages]
        accumulated: list[str] = []
        usage = None
        model_used = self.model
        response = self._client.chat.completions.create(
            model=self.model,
            messages=wire_messages,
            max_tokens=max_tokens,
            stream=True,
            stream_options={"include_usage": True},
        )
        for chunk in response:
            if chunk.choices:
                delta = chunk.choices[0].delta.content
                if delta:
                    accumulated.append(delta)
                    yield StreamChunk(text=delta)
            if getattr(chunk, "usage", None):
                usage = chunk.usage
            if getattr(chunk, "model", None):
                model_used = chunk.model

        yield StreamChunk(
            text="",
            done=True,
            final=TutorReply(
                text="".join(accumulated),
                provider=self.name,
                model=model_used,
                input_tokens=getattr(usage, "prompt_tokens", 0) if usage else 0,
                output_tokens=getattr(usage, "completion_tokens", 0) if usage else 0,
                cached_tokens=(
                    getattr(usage.prompt_tokens_details, "cached_tokens", 0)
                    if usage and getattr(usage, "prompt_tokens_details", None)
                    else 0
                ),
            ),
        )


# ─── Selection ─────────────────────────────────────────────────────────


def get_provider() -> LLMProvider:
    """Return the configured provider.

    Explicit selection via TUTOR_PROVIDER (=openai|anthropic|mock) wins and
    errors if the matching key is missing. Otherwise (unset or =auto) the
    cascade is: OPENAI_API_KEY -> ANTHROPIC_API_KEY -> MockProvider.
    """
    choice = os.environ.get("TUTOR_PROVIDER", "auto").lower()

    if choice == "openai":
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("TUTOR_PROVIDER=openai requires OPENAI_API_KEY")
        return OpenAIProvider(api_key=key)

    if choice == "anthropic":
        key = os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise RuntimeError("TUTOR_PROVIDER=anthropic requires ANTHROPIC_API_KEY")
        return AnthropicProvider(api_key=key)

    if choice == "mock":
        return MockProvider()

    # auto / unset / unknown — cascade by which key is present.
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        return OpenAIProvider(api_key=openai_key)

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_key:
        return AnthropicProvider(api_key=anthropic_key)

    return MockProvider()
