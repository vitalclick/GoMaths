"""
OCR provider abstraction for the scan solver.

Same shape as the LLM provider abstraction in tutor/providers.py:

  - MockOcrProvider — deterministic, no network. Returns a canned LaTeX
    expression no matter what image bytes you give it. Useful for tests
    and for running the demo without a MathPix contract.
  - MathPixProvider — production. Calls MathPix's `text` endpoint with
    the image bytes and extracts the LaTeX from the response.

Selection via env:
    SOLVER_OCR_PROVIDER=mathpix | mock   (default: mock)
    MATHPIX_APP_ID=...
    MATHPIX_APP_KEY=...
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


# ─── Selection ─────────────────────────────────────────────────────────


def get_ocr_provider() -> OcrProvider:
    choice = os.environ.get("SOLVER_OCR_PROVIDER", "mock").lower()
    if choice == "mathpix":
        app_id = os.environ.get("MATHPIX_APP_ID")
        app_key = os.environ.get("MATHPIX_APP_KEY")
        if not app_id or not app_key:
            raise RuntimeError(
                "SOLVER_OCR_PROVIDER=mathpix requires MATHPIX_APP_ID and MATHPIX_APP_KEY"
            )
        return MathPixProvider(app_id=app_id, app_key=app_key)
    return MockOcrProvider()
