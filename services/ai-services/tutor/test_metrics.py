"""
Tests for the prompt-cache metrics aggregator.

The point of these tests isn't to verify arithmetic — it's to make sure
the field we propagate is the one Anthropic actually sends, so the
production smoke test ("did the second request show cached>0?") is
catching a real signal.
"""

from __future__ import annotations

from .metrics import CacheMetrics


def test_first_request_records_zero_cached_when_anthropic_returns_zero() -> None:
    m = CacheMetrics()
    m.record(provider="anthropic", model="haiku", input_tokens=2000, output_tokens=200, cached_tokens=0)
    snap = m.snapshot()
    assert snap["requests"] == 1
    assert snap["input_tokens"] == 2000
    assert snap["cached_tokens"] == 0
    assert snap["cache_hit_ratio"] == 0.0


def test_second_warm_request_pushes_ratio_above_zero() -> None:
    m = CacheMetrics()
    # First request: cold, no cache.
    m.record(provider="anthropic", model="haiku", input_tokens=2000, output_tokens=200, cached_tokens=0)
    # Second: same persona + context, mostly served from cache.
    m.record(provider="anthropic", model="haiku", input_tokens=2000, output_tokens=200, cached_tokens=1800)
    snap = m.snapshot()
    assert snap["requests"] == 2
    assert snap["cached_tokens"] == 1800
    # 1800 / (2000 + 2000) = 0.45
    assert snap["cache_hit_ratio"] == 0.45


def test_reset_clears_state() -> None:
    m = CacheMetrics()
    m.record(provider="anthropic", model="haiku", input_tokens=10, output_tokens=10, cached_tokens=5)
    m.reset()
    assert m.snapshot() == {
        "requests": 0,
        "input_tokens": 0,
        "cached_tokens": 0,
        "output_tokens": 0,
        "cache_hit_ratio": 0.0,
    }


def test_zero_input_avoids_divide_by_zero() -> None:
    m = CacheMetrics()
    assert m.snapshot()["cache_hit_ratio"] == 0.0
