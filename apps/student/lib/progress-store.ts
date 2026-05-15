/**
 * In-memory progress store for the demo.
 *
 * Phase 1 swaps this for:
 *   - SQLite persistence on device (Expo)
 *   - POST /api/progress/events to the backend on connectivity
 *   - Conflict resolution via last-write-wins on `occurredAt`
 *
 * For the prototype it's enough to track per-topic attempts/correct and
 * notify subscribers when something changes (so the progress screen
 * re-renders without prop drilling).
 */

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

const events: ProgressEvent[] = [];
const listeners = new Set<Listener>();

export function record(event: Omit<ProgressEvent, "occurredAt">): void {
  events.push({ ...event, occurredAt: Date.now() });
  for (const l of listeners) l();
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function masteryByTopic(): Map<string, TopicMastery> {
  const map = new Map<string, TopicMastery>();
  for (const e of events) {
    const m = map.get(e.topicId) ?? {
      topicId: e.topicId,
      attempts: 0,
      correct: 0,
      masteryScore: 0,
      lastInteractionAt: e.occurredAt,
    };
    if (e.type === "question_attempted") m.attempts++;
    if (e.type === "question_correct") {
      m.attempts++;
      m.correct++;
    }
    if (e.type === "question_incorrect") m.attempts++;
    m.lastInteractionAt = e.occurredAt;
    m.masteryScore = m.attempts > 0 ? m.correct / m.attempts : 0;
    map.set(e.topicId, m);
  }
  return map;
}

export function _resetForTest(): void {
  events.length = 0;
  listeners.clear();
}
