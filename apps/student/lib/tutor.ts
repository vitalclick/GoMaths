/**
 * Tutor API client. Wraps the /api/tutor/* endpoints with the existing
 * authFetch — 401s are automatically refreshed.
 */

import { authFetch } from "./auth";

export interface TutorReplyBody {
  conversationId: string;
  reply: string;
  validated: boolean;
  /** Populated when the streaming `done` event arrives. */
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  provider?: string;
  model?: string;
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

export interface VerifiedClaim {
  raw: string;
  stem: string;
  answer: string;
  ok: boolean;
}

export interface StreamCallbacks {
  /** Called with each incremental chunk of text. */
  onDelta: (delta: string) => void;
  /** Called once the upstream emits `meta` (carries the conversation id). */
  onMeta?: (info: { conversationId: string }) => void;
  /** Called every time a mathematical claim in Maya's reply is validated. */
  onClaim?: (claim: VerifiedClaim) => void;
  /** Called when the stream completes successfully. */
  onDone: (final: TutorReplyBody) => void;
  /** Called on any error (network, upstream, parse). */
  onError: (error: Error) => void;
}

/**
 * Stream a tutor reply over SSE.
 *
 * Uses `react-native-sse` (which is also EventSource-shaped on web).
 * Returns an unsubscribe function callers should invoke on unmount.
 */
export function streamTutorMessage(
  input: { message: string; topicId?: string; conversationId?: string },
  cb: StreamCallbacks,
): () => void {
  let cancelled = false;
  let cancel: (() => void) | null = null;

  (async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");

      const { default: EventSource } = await import("react-native-sse");
      const { getItem } = await import("./secure-storage");
      const accessToken = await getItem("gomaths.access");

      const es = new EventSource(`${apiUrl}/api/tutor/messages/stream`, {
        method: "POST",
        body: JSON.stringify(input),
        headers: {
          "content-type": "application/json",
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        },
        // react-native-sse fires `open` once and then events as named.
        pollingInterval: 0,
      });
      if (cancelled) {
        es.close();
        return;
      }
      cancel = () => es.close();

      let accumulated = "";
      let receivedConv: string | undefined;
      let lastValidated = false;

      es.addEventListener("meta", (event) => {
        try {
          const data = JSON.parse((event as { data: string }).data) as {
            conversationId: string;
          };
          receivedConv = data.conversationId;
          cb.onMeta?.({ conversationId: data.conversationId });
        } catch {
          // tolerate malformed meta
        }
      });

      es.addEventListener("delta", (event) => {
        try {
          const data = JSON.parse((event as { data: string }).data) as { text: string };
          accumulated += data.text;
          cb.onDelta(data.text);
        } catch {
          // tolerate malformed delta
        }
      });

      es.addEventListener("claim", (event) => {
        try {
          const data = JSON.parse((event as { data: string }).data) as VerifiedClaim;
          cb.onClaim?.(data);
        } catch {
          // tolerate malformed claim
      });

      es.addEventListener("done", (event) => {
        try {
          const data = JSON.parse((event as { data: string }).data) as {
            reply?: string;
            validated?: boolean;
            input_tokens?: number;
            output_tokens?: number;
            cached_tokens?: number;
            provider?: string;
            model?: string;
          };
          lastValidated = Boolean(data.validated);
          cb.onDone({
            conversationId: receivedConv ?? input.conversationId ?? "",
            reply: data.reply ?? accumulated,
            validated: lastValidated,
            inputTokens: data.input_tokens,
            outputTokens: data.output_tokens,
            cachedTokens: data.cached_tokens,
            provider: data.provider,
            model: data.model,
          });
        } catch (e) {
          cb.onError(e as Error);
        } finally {
          es.close();
        }
      });

      es.addEventListener("error", (event) => {
        const message = (event as { message?: string }).message ?? "stream error";
        cb.onError(new Error(message));
        es.close();
      });
    } catch (e) {
      if (!cancelled) cb.onError(e as Error);
    }
  })();

  return () => {
    cancelled = true;
    cancel?.();
  };
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
