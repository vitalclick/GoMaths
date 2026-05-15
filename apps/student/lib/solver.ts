/**
 * Scan solver client.
 *
 * Two entry points:
 *  - scanImage(asset) — uploads a captured/picked image, returns the
 *    step-wise solution from the solver pipeline.
 *  - solveLatex(latex) — skip OCR, solve a LaTeX string directly. Useful
 *    when the user types the equation.
 */

import * as storage from "./secure-storage";

const ACCESS_KEY = "gomaths.access";
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

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
  if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");
  const accessToken = await storage.getItem(ACCESS_KEY);

  const form = new FormData();
  // FormData on RN accepts the { uri, name, type } trio directly.
  form.append(
    "image",
    {
      uri: asset.uri,
      name: asset.fileName ?? "scan.jpg",
      type: asset.mimeType ?? "image/jpeg",
    } as unknown as Blob,
  );

  const res = await fetch(`${apiUrl}/api/solver/scan`, {
    method: "POST",
    body: form,
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as SolverResponse;
}

export async function solveLatex(latex: string): Promise<SolverResponse> {
  if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");
  const accessToken = await storage.getItem(ACCESS_KEY);

  const res = await fetch(`${apiUrl}/api/solver/solve`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ latex }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as SolverResponse;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(", ");
    return body.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
