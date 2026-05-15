/**
 * Tutor API client. Wraps the /api/tutor/* endpoints with the existing
 * authFetch — 401s are automatically refreshed.
 */

import { authFetch } from "./auth";

export interface TutorReplyBody {
  conversationId: string;
  reply: string;
  validated: boolean;
}

export interface ConversationSummary {
  id: string;
  topicId?: string;
  createdAt: string;
  updatedAt: string;
  preview: string;
  turnCount: number;
}

export interface ConversationTurn {
  role: "user" | "maya";
  text: string;
  occurredAt: string;
  validated?: boolean;
}

export interface ConversationDetail {
  id: string;
  studentId: string;
  topicId?: string;
  createdAt: string;
  updatedAt: string;
  turns: ConversationTurn[];
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

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await authFetch("/api/tutor/conversations");
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as ConversationSummary[];
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const res = await authFetch(`/api/tutor/conversations/${id}`);
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as ConversationDetail;
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
