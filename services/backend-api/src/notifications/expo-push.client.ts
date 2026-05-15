/**
 * Minimal Expo Push API client.
 *
 * Wraps https://exp.host/--/api/v2/push/send. Batches up to 100 messages
 * per request (Expo's documented limit). No external SDK so the backend
 * stays one-fewer-deps.
 *
 * Phase 1 hardening to add:
 *  - Receipt polling (Expo returns ticket ids; the actual delivery
 *    success/failure is fetched separately via /push/getReceipts).
 *  - Token invalidation on DeviceNotRegistered receipts — call back
 *    into NotificationsService.revokeToken().
 *  - Per-batch retries on 5xx.
 */

export interface ExpoPushMessage {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  ttl?: number;
}

export interface ExpoPushTicket {
  id?: string;
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const MAX_BATCH = 100;

export class ExpoPushClient {
  async send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    const tickets: ExpoPushTicket[] = [];
    for (let i = 0; i < messages.length; i += MAX_BATCH) {
      const batch = messages.slice(i, i + MAX_BATCH);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "accept-encoding": "gzip, deflate",
          "content-type": "application/json",
        },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        throw new Error(`Expo push API: HTTP ${res.status}`);
      }
      const body = (await res.json()) as { data: ExpoPushTicket[] };
      tickets.push(...body.data);
    }
    return tickets;
  }
}
