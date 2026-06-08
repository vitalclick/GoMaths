"""Tests for the LLM provider abstraction."""

from types import SimpleNamespace
from typing import Any

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


def test_mock_provider_stream_yields_chunks_then_done() -> None:
    p = MockProvider()
    chunks = list(p.stream([TutorMessage(role="user", content="hello")]))
    deltas = [c for c in chunks if not c.done]
    final = [c for c in chunks if c.done]
    assert len(deltas) > 0
    assert len(final) == 1
    assert final[0].final is not None
    accumulated = "".join(c.text for c in deltas)
    assert accumulated == final[0].final.text


def _clear_provider_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TUTOR_PROVIDER", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


def test_get_provider_defaults_to_mock_when_nothing_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _clear_provider_env(monkeypatch)
    assert get_provider().name == "mock"


def test_get_provider_anthropic_requires_key(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_provider_env(monkeypatch)
    monkeypatch.setenv("TUTOR_PROVIDER", "anthropic")
    with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
        get_provider()


def test_get_provider_openai_requires_key(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_provider_env(monkeypatch)
    monkeypatch.setenv("TUTOR_PROVIDER", "openai")
    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        get_provider()


def test_get_provider_auto_prefers_openai_when_both_keys_present(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _clear_provider_env(monkeypatch)
    monkeypatch.setenv("OPENAI_API_KEY", "sk-openai")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-fallback")

    import openai

    monkeypatch.setattr(openai, "OpenAI", lambda **_: None)
    assert get_provider().name == "openai"


def test_get_provider_auto_falls_back_to_anthropic(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_provider_env(monkeypatch)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-fallback")

    import anthropic

    monkeypatch.setattr(anthropic, "Anthropic", lambda **_: None)
    assert get_provider().name == "anthropic"


def test_get_provider_auto_value_behaves_like_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_provider_env(monkeypatch)
    monkeypatch.setenv("TUTOR_PROVIDER", "auto")
    assert get_provider().name == "mock"


# ─── Anthropic provider (with the SDK monkeypatched) ──────────────────


class _FakeAnthropicMessages:
    def __init__(self, response: Any) -> None:
        self._response = response
        self.last_kwargs: dict[str, Any] | None = None

    def create(self, **kwargs: Any) -> Any:
        self.last_kwargs = kwargs
        return self._response


class _FakeAnthropic:
    def __init__(self, response: Any) -> None:
        self.messages = _FakeAnthropicMessages(response)


def test_anthropic_provider_sends_cached_system_blocks(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_response = SimpleNamespace(
        content=[SimpleNamespace(type="text", text="Hi! Let's solve it together.")],
        usage=SimpleNamespace(
            input_tokens=12,
            output_tokens=8,
            cache_read_input_tokens=100,
            cache_creation_input_tokens=0,
        ),
    )
    fake_client = _FakeAnthropic(fake_response)

    import anthropic

    monkeypatch.setattr(anthropic, "Anthropic", lambda **_: fake_client)

    p = AnthropicProvider(api_key="sk-test", model="claude-haiku-4-5")
    reply = p.complete(
        [
            TutorMessage(role="system", content="You are Maya."),
            TutorMessage(role="system", content="Topic context: linear equations."),
            TutorMessage(role="user", content="What is 2x + 5 = 13?"),
        ]
    )

    assert reply.text == "Hi! Let's solve it together."
    assert reply.input_tokens == 12
    assert reply.output_tokens == 8
    assert reply.cached_tokens == 100

    sent = fake_client.messages.last_kwargs
    assert sent is not None
    assert sent["system"] == [
        {"type": "text", "text": "You are Maya.", "cache_control": {"type": "ephemeral"}},
        {
            "type": "text",
            "text": "Topic context: linear equations.",
            "cache_control": {"type": "ephemeral"},
        },
    ]
    assert sent["messages"] == [{"role": "user", "content": "What is 2x + 5 = 13?"}]


# ─── OpenAI provider (with the SDK monkeypatched) ─────────────────────


class _FakeOpenAIChatCompletions:
    def __init__(self, response: Any) -> None:
        self._response = response
        self.last_kwargs: dict[str, Any] | None = None

    def create(self, **kwargs: Any) -> Any:
        self.last_kwargs = kwargs
        return self._response


class _FakeOpenAI:
    def __init__(self, response: Any) -> None:
        self.chat = SimpleNamespace(completions=_FakeOpenAIChatCompletions(response))


def test_openai_provider_flattens_messages(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_response = SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content="OpenAI reply"))],
        usage=SimpleNamespace(
            prompt_tokens=20,
            completion_tokens=5,
            prompt_tokens_details=SimpleNamespace(cached_tokens=15),
        ),
    )
    fake_client = _FakeOpenAI(fake_response)

    import openai

    monkeypatch.setattr(openai, "OpenAI", lambda **_: fake_client)

    p = OpenAIProvider(api_key="sk-test", model="gpt-4o-mini")
    reply = p.complete(
        [
            TutorMessage(role="system", content="You are Maya."),
            TutorMessage(role="user", content="Hello"),
        ]
    )

    assert reply.text == "OpenAI reply"
    assert reply.input_tokens == 20
    assert reply.output_tokens == 5
    assert reply.cached_tokens == 15
    sent = fake_client.chat.completions.last_kwargs
    assert sent is not None
    assert sent["messages"] == [
        {"role": "system", "content": "You are Maya."},
        {"role": "user", "content": "Hello"},
    ]
