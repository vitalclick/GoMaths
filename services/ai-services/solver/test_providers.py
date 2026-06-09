"""Tests for the OCR provider abstraction."""

from types import SimpleNamespace
from typing import Any

import pytest

from solver.providers import (
    ClaudeVisionProvider,
    MathPixProvider,
    MockOcrProvider,
    OpenAIVisionProvider,
    get_ocr_provider,
)


def _clear_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for k in (
        "SOLVER_OCR_PROVIDER",
        "SOLVER_OCR_MODEL",
        "MATHPIX_APP_ID",
        "MATHPIX_APP_KEY",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
    ):
        monkeypatch.delenv(k, raising=False)


# ─── Mock ──────────────────────────────────────────────────────────────


def test_mock_provider_returns_canned_latex() -> None:
    p = MockOcrProvider()
    r = p.recognise(b"fake-image-bytes-here")
    assert r.accepted
    assert r.latex is not None
    assert r.provider == "mock"


def test_mock_provider_rejects_empty_input() -> None:
    p = MockOcrProvider()
    r = p.recognise(b"")
    assert not r.accepted


# ─── Explicit selection + missing-key errors ───────────────────────────


def test_get_ocr_provider_defaults_to_mock_when_nothing_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _clear_env(monkeypatch)
    assert get_ocr_provider().name == "mock"


def test_get_ocr_provider_mathpix_requires_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    monkeypatch.setenv("SOLVER_OCR_PROVIDER", "mathpix")
    with pytest.raises(RuntimeError, match="MATHPIX_APP"):
        get_ocr_provider()


def test_get_ocr_provider_openai_requires_key(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    monkeypatch.setenv("SOLVER_OCR_PROVIDER", "openai")
    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        get_ocr_provider()


def test_get_ocr_provider_claude_requires_key(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    monkeypatch.setenv("SOLVER_OCR_PROVIDER", "claude")
    with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
        get_ocr_provider()


def test_get_ocr_provider_returns_mathpix_when_keyed(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    monkeypatch.setenv("SOLVER_OCR_PROVIDER", "mathpix")
    monkeypatch.setenv("MATHPIX_APP_ID", "id-x")
    monkeypatch.setenv("MATHPIX_APP_KEY", "key-x")
    p = get_ocr_provider()
    assert isinstance(p, MathPixProvider)


# ─── Cascade (auto / unset) ────────────────────────────────────────────


def test_get_ocr_provider_auto_prefers_mathpix(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    monkeypatch.setenv("MATHPIX_APP_ID", "id-x")
    monkeypatch.setenv("MATHPIX_APP_KEY", "key-x")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-openai")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant")
    assert get_ocr_provider().name == "mathpix"


def test_get_ocr_provider_auto_falls_back_to_openai(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    monkeypatch.setenv("OPENAI_API_KEY", "sk-openai")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant")

    import openai

    monkeypatch.setattr(openai, "OpenAI", lambda **_: None)
    assert get_ocr_provider().name == "openai-vision"


def test_get_ocr_provider_auto_falls_back_to_claude(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant")

    import anthropic

    monkeypatch.setattr(anthropic, "Anthropic", lambda **_: None)
    assert get_ocr_provider().name == "claude-vision"


def test_get_ocr_provider_auto_value_behaves_like_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    monkeypatch.setenv("SOLVER_OCR_PROVIDER", "auto")
    assert get_ocr_provider().name == "mock"


# ─── OpenAI vision provider (SDK monkeypatched) ────────────────────────


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


def _openai_response(text: str) -> Any:
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=text))])


def test_openai_vision_recognises_returns_clean_latex(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeOpenAI(_openai_response("2x + 5 = 13"))

    import openai

    monkeypatch.setattr(openai, "OpenAI", lambda **_: fake)

    p = OpenAIVisionProvider(api_key="sk-test")
    r = p.recognise(b"fake-image", "image/png")
    assert r.accepted
    assert r.latex == "2x + 5 = 13"
    assert r.provider == "openai-vision"

    sent = fake.chat.completions.last_kwargs
    assert sent is not None
    assert sent["model"] == "gpt-4o-mini"
    image_block = sent["messages"][0]["content"][1]
    assert image_block["type"] == "image_url"
    assert image_block["image_url"]["url"].startswith("data:image/png;base64,")


def test_openai_vision_strips_dollar_delimiters(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeOpenAI(_openai_response("$$x^2 + 5x + 6 = 0$$"))

    import openai

    monkeypatch.setattr(openai, "OpenAI", lambda **_: fake)

    r = OpenAIVisionProvider(api_key="sk-test").recognise(b"img")
    assert r.accepted
    assert r.latex == "x^2 + 5x + 6 = 0"


def test_openai_vision_returns_not_accepted_on_no_math(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeOpenAI(_openai_response("NO_MATH"))

    import openai

    monkeypatch.setattr(openai, "OpenAI", lambda **_: fake)

    r = OpenAIVisionProvider(api_key="sk-test").recognise(b"img")
    assert not r.accepted
    assert r.latex is None


def test_openai_vision_handles_sdk_exception(monkeypatch: pytest.MonkeyPatch) -> None:
    class _Boom:
        chat = SimpleNamespace(
            completions=SimpleNamespace(
                create=lambda **_: (_ for _ in ()).throw(RuntimeError("network down"))
            )
        )

    import openai

    monkeypatch.setattr(openai, "OpenAI", lambda **_: _Boom())
    r = OpenAIVisionProvider(api_key="sk-test").recognise(b"img")
    assert not r.accepted
    assert "network down" in r.detail


def test_openai_vision_rejects_empty_input() -> None:
    p = OpenAIVisionProvider.__new__(OpenAIVisionProvider)
    p.model = "gpt-4o-mini"  # bypass __init__ so we don't need the SDK
    r = p.recognise(b"")
    assert not r.accepted


# ─── Claude vision provider (SDK monkeypatched) ────────────────────────


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


def _claude_response(text: str) -> Any:
    return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])


def test_claude_vision_recognises_returns_clean_latex(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeAnthropic(_claude_response("3x - 7 = 2x + 5"))

    import anthropic

    monkeypatch.setattr(anthropic, "Anthropic", lambda **_: fake)

    p = ClaudeVisionProvider(api_key="sk-ant-test")
    r = p.recognise(b"fake-image", "image/jpeg")
    assert r.accepted
    assert r.latex == "3x - 7 = 2x + 5"
    assert r.provider == "claude-vision"

    sent = fake.messages.last_kwargs
    assert sent is not None
    assert sent["model"] == "claude-haiku-4-5"
    image_block = sent["messages"][0]["content"][0]
    assert image_block["type"] == "image"
    assert image_block["source"]["media_type"] == "image/jpeg"


def test_claude_vision_strips_code_fence(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeAnthropic(_claude_response("```latex\n2^x = 32\n```"))

    import anthropic

    monkeypatch.setattr(anthropic, "Anthropic", lambda **_: fake)

    r = ClaudeVisionProvider(api_key="sk-ant").recognise(b"img")
    assert r.accepted
    assert r.latex == "2^x = 32"


def test_claude_vision_returns_not_accepted_on_no_math(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeAnthropic(_claude_response("NO_MATH"))

    import anthropic

    monkeypatch.setattr(anthropic, "Anthropic", lambda **_: fake)

    r = ClaudeVisionProvider(api_key="sk-ant").recognise(b"img")
    assert not r.accepted


def test_claude_vision_rejects_empty_input() -> None:
    p = ClaudeVisionProvider.__new__(ClaudeVisionProvider)
    p.model = "claude-haiku-4-5"
    r = p.recognise(b"")
    assert not r.accepted


# ─── SOLVER_OCR_MODEL override ─────────────────────────────────────────


def test_solver_ocr_model_override_applies_to_openai(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    monkeypatch.setenv("SOLVER_OCR_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.setenv("SOLVER_OCR_MODEL", "gpt-4o")

    import openai

    monkeypatch.setattr(openai, "OpenAI", lambda **_: None)
    p = get_ocr_provider()
    assert isinstance(p, OpenAIVisionProvider)
    assert p.model == "gpt-4o"
