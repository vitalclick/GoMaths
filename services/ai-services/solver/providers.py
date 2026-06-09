"""
OCR provider abstraction for the scan solver.

Four implementations:

  - MockOcrProvider — deterministic, no network. Used as the final
    fallback when nothing else is configured.
  - MathPixProvider — purpose-built for maths OCR, best quality.
  - OpenAIVisionProvider — GPT-4o-class vision models. Cheap, good
    quality on printed maths, reuses OPENAI_API_KEY from the tutor.
  - ClaudeVisionProvider — Claude vision models. Same idea with
    ANTHROPIC_API_KEY.

Selection via env:

    SOLVER_OCR_PROVIDER=mathpix    # force MathPix  (errors if no keys)
    SOLVER_OCR_PROVIDER=openai     # force OpenAI   (errors if no OPENAI_API_KEY)
    SOLVER_OCR_PROVIDER=claude     # force Claude   (errors if no ANTHROPIC_API_KEY)
    SOLVER_OCR_PROVIDER=mock       # force mock
    SOLVER_OCR_PROVIDER=auto / unset
        # cascade by which credentials are present, in quality order:
        #   1. MATHPIX_APP_ID + MATHPIX_APP_KEY -> MathPix
        #   2. OPENAI_API_KEY                   -> OpenAI vision
        #   3. ANTHROPIC_API_KEY                -> Claude vision
        #   4. neither                          -> Mock

Production keys:
    MATHPIX_APP_ID=...
    MATHPIX_APP_KEY=...
    OPENAI_API_KEY=sk-...
    ANTHROPIC_API_KEY=sk-ant-...

Optional model override (applies to whichever LLM provider runs):
    SOLVER_OCR_MODEL=gpt-4o-mini | claude-haiku-4-5 | ...
"""

from __future__ import annotations

import base64
import os
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class OcrResult:
    accepted: bool
    latex: str | None
    confidence: float | None
    provider: str
    detail: str = ""


class OcrProvider(Protocol):
    name: str

    def recognise(self, image_bytes: bytes, content_type: str = "image/jpeg") -> OcrResult:
        ...


# Shared prompt for the two LLM-vision providers. Asking for ONLY the
# LaTeX (no prose, no delimiters) means we can use the response verbatim.
# `NO_MATH` is a sentinel for "image contains nothing recognisable"; the
# providers turn it into `accepted=False`.
_VISION_PROMPT = (
    "Extract the mathematical expression from this image and return ONLY "
    "the LaTeX representation. No prose, no $...$ delimiters, no "
    "explanation. If there is no mathematical content, return exactly: "
    "NO_MATH"
)


# ─── Mock ──────────────────────────────────────────────────────────────


class MockOcrProvider:
    """
    Deterministic OCR for tests/demos. Returns one of a small set of
    canned expressions, cycling by image-length so successive uploads
    in a demo session look different.
    """

    name = "mock"

    _CANNED = [
        "x^2 + 5x + 6 = 0",
        "2x + 5 = 13",
        "3x - 7 = 2x + 5",
        "2^x = 32",
    ]

    def recognise(self, image_bytes: bytes, content_type: str = "image/jpeg") -> OcrResult:
        if not image_bytes:
            return OcrResult(
                accepted=False, latex=None, confidence=None, provider=self.name, detail="empty image"
            )
        idx = len(image_bytes) % len(self._CANNED)
        return OcrResult(
            accepted=True,
            latex=self._CANNED[idx],
            confidence=0.99,
            provider=self.name,
        )


# ─── MathPix ──────────────────────────────────────────────────────────


class MathPixProvider:
    """
    Production MathPix OCR. Phase 1 hardening:
      - Retry on transient errors
      - Per-tenant rate limiting (parents abusing the camera shouldn't
        burn the company's MathPix quota)
      - Tag requests by student id for cost attribution
    """

    name = "mathpix"

    def __init__(self, app_id: str, app_key: str) -> None:
        self.app_id = app_id
        self.app_key = app_key

    def recognise(self, image_bytes: bytes, content_type: str = "image/jpeg") -> OcrResult:
        import requests  # Imported lazily; only needed when this provider is selected.

        encoded = base64.b64encode(image_bytes).decode("ascii")
        payload = {
            "src": f"data:{content_type};base64,{encoded}",
            "formats": ["latex_styled"],
            "ocr": ["math", "text"],
            "math_inline_delimiters": ["$", "$"],
        }
        try:
            resp = requests.post(
                "https://api.mathpix.com/v3/text",
                json=payload,
                headers={
                    "app_id": self.app_id,
                    "app_key": self.app_key,
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
        except requests.RequestException as exc:
            return OcrResult(
                accepted=False, latex=None, confidence=None, provider=self.name, detail=str(exc)
            )

        if resp.status_code != 200:
            return OcrResult(
                accepted=False,
                latex=None,
                confidence=None,
                provider=self.name,
                detail=f"mathpix {resp.status_code}",
            )

        body = resp.json()
        latex = body.get("latex_styled") or body.get("text", "").strip("$")
        if not latex:
            return OcrResult(
                accepted=False,
                latex=None,
                confidence=body.get("confidence"),
                provider=self.name,
                detail="no latex returned",
            )
        return OcrResult(
            accepted=True,
            latex=latex,
            confidence=body.get("confidence"),
            provider=self.name,
        )


# ─── OpenAI vision ─────────────────────────────────────────────────────


class OpenAIVisionProvider:
    """
    OCR via OpenAI's vision-capable chat models (gpt-4o-mini by default).

    Cheap (~$0.0008/image at gpt-4o-mini's low-detail tier) and good at
    printed maths. Handwriting quality varies — fine for a beta, may want
    MathPix once real students start sending photos.

    The model doesn't return a confidence score, so `confidence` is None
    on success.
    """

    name = "openai-vision"

    def __init__(self, api_key: str, model: str | None = None) -> None:
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key)
        self.model = model or "gpt-4o-mini"

    def recognise(self, image_bytes: bytes, content_type: str = "image/jpeg") -> OcrResult:
        if not image_bytes:
            return OcrResult(
                accepted=False, latex=None, confidence=None, provider=self.name, detail="empty image"
            )

        b64 = base64.b64encode(image_bytes).decode("ascii")
        try:
            response = self._client.chat.completions.create(
                model=self.model,
                max_tokens=300,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": _VISION_PROMPT},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{content_type};base64,{b64}"},
                            },
                        ],
                    }
                ],
            )
        except Exception as exc:  # network, auth, content filter — all map to "not accepted"
            return OcrResult(
                accepted=False, latex=None, confidence=None, provider=self.name, detail=str(exc)
            )

        raw = (response.choices[0].message.content or "").strip()
        return _result_from_vision_text(raw, self.name)


# ─── Claude vision ─────────────────────────────────────────────────────


class ClaudeVisionProvider:
    """
    OCR via Anthropic Claude's vision-capable models (claude-haiku-4-5 by
    default). Similar quality to OpenAI vision; pick whichever LLM
    provider you're already paying for.
    """

    name = "claude-vision"

    def __init__(self, api_key: str, model: str | None = None) -> None:
        from anthropic import Anthropic

        self._client = Anthropic(api_key=api_key)
        self.model = model or "claude-haiku-4-5"

    def recognise(self, image_bytes: bytes, content_type: str = "image/jpeg") -> OcrResult:
        if not image_bytes:
            return OcrResult(
                accepted=False, latex=None, confidence=None, provider=self.name, detail="empty image"
            )

        b64 = base64.b64encode(image_bytes).decode("ascii")
        try:
            response = self._client.messages.create(
                model=self.model,
                max_tokens=300,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": content_type,
                                    "data": b64,
                                },
                            },
                            {"type": "text", "text": _VISION_PROMPT},
                        ],
                    }
                ],
            )
        except Exception as exc:
            return OcrResult(
                accepted=False, latex=None, confidence=None, provider=self.name, detail=str(exc)
            )

        raw = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        ).strip()
        return _result_from_vision_text(raw, self.name)


def _result_from_vision_text(raw: str, provider_name: str) -> OcrResult:
    """Normalise a vision model's text response into an OcrResult."""
    cleaned = raw.strip().strip("`").strip()
    if cleaned.lower().startswith("latex"):
        # Some models return a ```latex ... ``` fence; strip the language tag.
        cleaned = cleaned[len("latex") :].lstrip("\n ").strip()
    cleaned = cleaned.strip("`").strip()

    if not cleaned or cleaned.upper() == "NO_MATH":
        return OcrResult(
            accepted=False,
            latex=None,
            confidence=None,
            provider=provider_name,
            detail="no maths detected",
        )

    # Drop any surrounding $ / $$ the model added despite being told not to.
    cleaned = cleaned.strip()
    while cleaned.startswith("$"):
        cleaned = cleaned[1:]
    while cleaned.endswith("$"):
        cleaned = cleaned[:-1]
    cleaned = cleaned.strip()

    if not cleaned:
        return OcrResult(
            accepted=False,
            latex=None,
            confidence=None,
            provider=provider_name,
            detail="empty after cleanup",
        )

    return OcrResult(
        accepted=True,
        latex=cleaned,
        confidence=None,
        provider=provider_name,
    )


# ─── Selection ─────────────────────────────────────────────────────────


def get_ocr_provider() -> OcrProvider:
    """Return the configured OCR provider.

    Explicit selection via SOLVER_OCR_PROVIDER wins and errors if its
    credentials are missing. Otherwise (unset or =auto), cascade by
    available credentials in quality order:
        MathPix -> OpenAI vision -> Claude vision -> Mock.
    """
    choice = os.environ.get("SOLVER_OCR_PROVIDER", "auto").lower()
    model_override = os.environ.get("SOLVER_OCR_MODEL") or None

    if choice == "mathpix":
        app_id = os.environ.get("MATHPIX_APP_ID")
        app_key = os.environ.get("MATHPIX_APP_KEY")
        if not app_id or not app_key:
            raise RuntimeError(
                "SOLVER_OCR_PROVIDER=mathpix requires MATHPIX_APP_ID and MATHPIX_APP_KEY"
            )
        return MathPixProvider(app_id=app_id, app_key=app_key)

    if choice == "openai":
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("SOLVER_OCR_PROVIDER=openai requires OPENAI_API_KEY")
        return OpenAIVisionProvider(api_key=key, model=model_override)

    if choice == "claude":
        key = os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise RuntimeError("SOLVER_OCR_PROVIDER=claude requires ANTHROPIC_API_KEY")
        return ClaudeVisionProvider(api_key=key, model=model_override)

    if choice == "mock":
        return MockOcrProvider()

    # auto / unset / unknown — cascade by which credentials are present.
    mathpix_id = os.environ.get("MATHPIX_APP_ID")
    mathpix_key = os.environ.get("MATHPIX_APP_KEY")
    if mathpix_id and mathpix_key:
        return MathPixProvider(app_id=mathpix_id, app_key=mathpix_key)

    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        return OpenAIVisionProvider(api_key=openai_key, model=model_override)

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_key:
        return ClaudeVisionProvider(api_key=anthropic_key, model=model_override)

    return MockOcrProvider()
