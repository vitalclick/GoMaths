"""Tests for the OCR provider abstraction."""

import pytest

from solver.providers import MathPixProvider, MockOcrProvider, get_ocr_provider


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


def test_get_ocr_provider_defaults_to_mock(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SOLVER_OCR_PROVIDER", raising=False)
    p = get_ocr_provider()
    assert p.name == "mock"


def test_get_ocr_provider_mathpix_requires_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SOLVER_OCR_PROVIDER", "mathpix")
    monkeypatch.delenv("MATHPIX_APP_ID", raising=False)
    monkeypatch.delenv("MATHPIX_APP_KEY", raising=False)
    with pytest.raises(RuntimeError, match="MATHPIX_APP"):
        get_ocr_provider()


def test_get_ocr_provider_returns_mathpix_when_keyed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SOLVER_OCR_PROVIDER", "mathpix")
    monkeypatch.setenv("MATHPIX_APP_ID", "id-x")
    monkeypatch.setenv("MATHPIX_APP_KEY", "key-x")
    p = get_ocr_provider()
    assert isinstance(p, MathPixProvider)
