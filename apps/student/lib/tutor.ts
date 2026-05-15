/**
 * Tutor API client. Wraps POST /api/tutor/messages with the existing
 * authFetch — so 401s are automatically refreshed.
 */

import { authFetch } from "./auth";

export interface TutorReplyBody {
  conversationId: string;
  reply: string;
  validated: boolean;
}

export async function sendTutorMessage(input: {
  message: string;
  topicId?: string;
  conversationId?: string;
}): Promise<TutorReplyBody> {
  const res = await authFetch("/api/tutor/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as TutorReplyBody;
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
