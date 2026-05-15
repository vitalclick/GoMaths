"""
Tutor service metrics.

Tracks Anthropic prompt-cache effectiveness across the lifetime of the
process. The /metrics/cache endpoint exposes the aggregate so ops can
verify that `cached_input_tokens > 0` after the first warm request —
the single highest-value smoke test against the production budget
assumption (see HANDOFF.md risk #1).

This is intentionally a process-local counter, not Prometheus. Phase 1
should reach for prom_client + the standard /metrics scrape path once
multi-pod cardinality matters; today a single-pod tutor service is fine.
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from typing import Final


_LOG: Final = logging.getLogger("gomaths.tutor.metrics")


@dataclass
class _Snapshot:
    requests: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cached_tokens: int = 0


class CacheMetrics:
    """Process-local counters for prompt-cache observability."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._snap = _Snapshot()

    def record(
        self,
        *,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        cached_tokens: int,
    ) -> None:
        with self._lock:
            self._snap.requests += 1
            self._snap.input_tokens += int(input_tokens)
            self._snap.output_tokens += int(output_tokens)
            self._snap.cached_tokens += int(cached_tokens)
            snap = _Snapshot(**self._snap.__dict__)

        # Structured log per request — easy to grep in CloudWatch, and
        # Sentry breadcrumbs pick the message up automatically.
        ratio = _safe_ratio(snap.cached_tokens, snap.input_tokens)
        _LOG.info(
            "tutor.tokens provider=%s model=%s input=%d cached=%d output=%d total_ratio=%.3f",
            provider,
            model,
            input_tokens,
            cached_tokens,
            output_tokens,
            ratio,
        )

    def snapshot(self) -> dict:
        with self._lock:
            snap = _Snapshot(**self._snap.__dict__)
        ratio = _safe_ratio(snap.cached_tokens, snap.input_tokens)
        return {
            "requests": snap.requests,
            "input_tokens": snap.input_tokens,
            "cached_tokens": snap.cached_tokens,
            "output_tokens": snap.output_tokens,
            "cache_hit_ratio": round(ratio, 4),
        }

    def reset(self) -> None:
        """Test helper."""
        with self._lock:
            self._snap = _Snapshot()


def _safe_ratio(num: int, den: int) -> float:
    return (num / den) if den > 0 else 0.0


# Single process-wide instance the FastAPI app reads/writes.
metrics = CacheMetrics()
