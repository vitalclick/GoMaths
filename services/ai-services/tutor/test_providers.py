"""Tests for the LLM provider abstraction."""

import os
import pytest

from tutor.providers import (
    AnthropicProvider,
    MockProvider,
    OpenAIProvider,
    TutorMessage,
    get_provider,
)


def test_mock_provider_responds_to_hello() -> None:
    p = MockProvider()
    reply = p.complete([TutorMessage(role="user", content="hello Maya")])
    assert reply.provider == "mock"
    assert "maths" in reply.text.lower()


def test_mock_provider_handles_solve_request() -> None:
    p = MockProvider()
    reply = p.complete([TutorMessage(role="user", content="solve 2x + 5 = 13")])
    assert "both sides" in reply.text.lower()


def test_get_provider_defaults_to_mock(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TUTOR_PROVIDER", raising=False)
    p = get_provider()
    assert p.name == "mock"


def test_get_provider_openai_requires_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TUTOR_PROVIDER", "openai")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        get_provider()


def test_get_provider_openai_returns_provider_when_keyed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TUTOR_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    p = get_provider()
    assert isinstance(p, OpenAIProvider)


def test_openai_provider_complete_is_unimplemented() -> None:
    p = OpenAIProvider(api_key="sk-test")
    with pytest.raises(NotImplementedError):
        p.complete([TutorMessage(role="user", content="hi")])


def test_anthropic_provider_complete_is_unimplemented() -> None:
    p = AnthropicProvider(api_key="key")
    with pytest.raises(NotImplementedError):
        p.complete([TutorMessage(role="user", content="hi")])
