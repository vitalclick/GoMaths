/**
 * N taps within a short window fire a callback — the classic "tap the build
 * number 7 times" pattern, used to reach developer mode without a toggle
 * that's visible to every learner.
 */

import { useCallback, useRef } from "react";

const DEFAULT_TAPS_REQUIRED = 5;
const DEFAULT_WINDOW_MS = 2000;

export function useSecretTap(
  onUnlock: () => void,
  options?: { tapsRequired?: number; windowMs?: number },
): () => void {
  const tapsRequired = options?.tapsRequired ?? DEFAULT_TAPS_REQUIRED;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const countRef = useRef(0);
  const firstTapAtRef = useRef(0);

  return useCallback(() => {
    const now = Date.now();
    if (now - firstTapAtRef.current > windowMs) {
      countRef.current = 0;
      firstTapAtRef.current = now;
    }
    countRef.current += 1;
    if (countRef.current >= tapsRequired) {
      countRef.current = 0;
      onUnlock();
    }
  }, [onUnlock, tapsRequired, windowMs]);
}
