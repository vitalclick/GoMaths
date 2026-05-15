"""
LLM provider abstraction.

ADR-005 leaves the production provider open (OpenAI / Anthropic / dual).
This module is the seam between the tutor service and whichever LLM(s) we
end up using. Phase 1 wiring should:

  1. Pick a provider via env (`TUTOR_PROVIDER=openai|anthropic|mock`).
  2. Implement the chosen provider in this file (real API calls).
  3. Keep the `LLMProvider` protocol stable so the rest of the service
     doesn't need to change.

The MockProvider returned for `TUTOR_PROVIDER=mock` (the default in dev)
is deterministic — it does not call any external service and is safe to
use in CI and on local machines without API keys.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class TutorMessage:
    role: str  # "system" | "user" | "assistant"
    content: str


@dataclass(frozen=True)
class TutorReply:
    text: str
    provider: str
    model: str


class LLMProvider(Protocol):
    name: str

    def complete(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> TutorReply:
        ...


class MockProvider:
    """
    Deterministic stand-in for a real LLM. Returns canned responses based on
    keywords in the most recent user message. Used in dev and CI.
    """

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


class OpenAIProvider:
    """
    Production OpenAI provider. NOT WIRED YET — Phase 1 must add the
    `openai` SDK to dependencies and implement `complete`.
    """

    name = "openai"

    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        self.api_key = api_key
        self.model = model

    def complete(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> TutorReply:
        raise NotImplementedError(
            "OpenAIProvider is a stub. Phase 1: add openai SDK, implement, then remove this."
        )


class AnthropicProvider:
    """
    Production Anthropic provider. NOT WIRED YET — Phase 1 must add the
    `anthropic` SDK to dependencies and implement `complete`.
    """

    name = "anthropic"

    def __init__(self, api_key: str, model: str = "claude-haiku-4-5") -> None:
        self.api_key = api_key
        self.model = model

    def complete(self, messages: list[TutorMessage], *, max_tokens: int = 600) -> TutorReply:
        raise NotImplementedError(
            "AnthropicProvider is a stub. Phase 1: add anthropic SDK, implement, then remove this."
        )


def get_provider() -> LLMProvider:
    """Return the configured provider. Defaults to MockProvider."""
    choice = os.environ.get("TUTOR_PROVIDER", "mock").lower()
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
    return MockProvider()
