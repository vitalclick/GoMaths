/**
 * Per-topic mastery store with SecureStore persistence.
 *
 * Progress survives app restarts. The store hydrates from SecureStore
 * asynchronously on module load; subscribers are notified once loaded.
 *
 * Phase 2 will also POST events to /api/progress/events for cross-device
 * sync. For now, device-local SecureStore is the source of truth.
 */

import * as storage from "./secure-storage";

const STORE_KEY = "gomaths.progress.v1";

export type ProgressEventType =
  | "lesson_started"
  | "lesson_completed"
  | "question_attempted"
  | "question_correct"
  | "question_incorrect";

export interface ProgressEvent {
  type: ProgressEventType;
  topicId: string;
  questionId?: string;
  occurredAt: number;
}

export interface TopicMastery {
  topicId: string;
  attempts: number;
  correct: number;
  masteryScore: number;
  lastInteractionAt: number;
}

type Listener = () => void;

const mastery = new Map<string, TopicMastery>();
const listeners = new Set<Listener>();
let hydrated = false;

async function hydrate(): Promise<void> {
  try {
    const raw = await storage.getItem(STORE_KEY);
    if (raw) {
      const saved: TopicMastery[] = JSON.parse(raw);
      for (const m of saved) mastery.set(m.topicId, { ...m });
    }
  } catch {
    // corrupted store — start fresh
  } finally {
    hydrated = true;
    for (const l of listeners) l();
  }
}

void hydrate();

async function persist(): Promise<void> {
  try {
    await storage.setItem(STORE_KEY, JSON.stringify([...mastery.values()]));
  } catch {
    // non-critical; in-memory state is still correct for this session
  }
}

export function record(event: Omit<ProgressEvent, "occurredAt">): void {
  const now = Date.now();
  const m: TopicMastery = mastery.get(event.topicId) ?? {
    topicId: event.topicId,
    attempts: 0,
    correct: 0,
    masteryScore: 0,
    lastInteractionAt: now,
  };

  if (event.type === "question_attempted") m.attempts++;
  if (event.type === "question_correct") {
    m.attempts++;
    m.correct++;
  }
  if (event.type === "question_incorrect") m.attempts++;
  m.lastInteractionAt = now;
  m.masteryScore = m.attempts > 0 ? m.correct / m.attempts : 0;

  mastery.set(event.topicId, m);
  void persist();
  for (const l of listeners) l();
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function masteryByTopic(): Map<string, TopicMastery> {
  return mastery;
}

/** True once the initial load from SecureStore has completed. */
export function isHydrated(): boolean {
  return hydrated;
}

export function _resetForTest(): void {
  mastery.clear();
  hydrated = false;
  listeners.clear();
}
