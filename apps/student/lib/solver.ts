/**
 * Scan solver client.
 *
 * Two entry points:
 *  - scanImage(asset) — uploads a captured/picked image, returns the
 *    step-wise solution from the solver pipeline.
 *  - solveLatex(latex) — skip OCR, solve a LaTeX string directly. Useful
 *    when the user types the equation.
 */

import { authFetch } from "./auth";

/**
 * A scan is an upload plus OCR plus a solve, so it needs a longer leash than
 * the default request timeout — but still a finite one, otherwise a stalled
 * upload hangs the screen on "Working…" forever.
 */
const SCAN_TIMEOUT_MS = 60_000;

export interface SolverStep {
  explanation: string;
  math: string;
}

export interface SolverResponse {
  accepted: boolean;
  finalAnswer: string | null;
  steps: SolverStep[];
  detectedLatex: string | null;
  ocrProvider: string;
  ocrConfidence: number | null;
  detail: string;
}

export interface ScanAsset {
  /** A URI (local file path on native; blob/object URL on web). */
  uri: string;
  /** MIME type when known; falls back to image/jpeg. */
  mimeType?: string;
  /** File name when known. */
  fileName?: string;
}

export async function scanImage(asset: ScanAsset): Promise<SolverResponse> {
  const form = new FormData();
  // FormData on RN accepts the { uri, name, type } trio directly.
  form.append("image", {
    uri: asset.uri,
    name: asset.fileName ?? "scan.jpg",
    type: asset.mimeType ?? "image/jpeg",
  } as unknown as Blob);

  // Via authFetch, not a bare fetch: the access token expires after 15
  // minutes and this is the one screen a learner is most likely to open
  // long after signing in.
  const res = await authFetch("/api/solver/scan", {
    method: "POST",
    body: form,
    timeoutMs: SCAN_TIMEOUT_MS,
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as SolverResponse;
}

export async function solveLatex(latex: string): Promise<SolverResponse> {
  const res = await authFetch("/api/solver/solve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ latex }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as SolverResponse;
}

async function readError(res: Response): Promise<string> {
  // authFetch already refreshed and replayed, so a 401 here means the
  // session is genuinely done — say that rather than echoing the API's
  // "Invalid or expired token", which reads like a bug to a learner.
  if (res.status === 401) return "Your session has expired. Please sign in again.";
  if (res.status === 413) return "That image is too large. Try a closer, smaller photo.";
  if (res.status === 429) return "Too many scans in a row. Wait a minute and try again.";
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(", ");
    return body.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
