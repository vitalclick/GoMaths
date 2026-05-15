import { Injectable } from "@nestjs/common";
import type { ProgressEventInputDto, ProgressEventType } from "./progress.dto";

export interface ProgressEvent extends ProgressEventInputDto {
  id: string;
  studentId: string;
  occurredAt: string;
}

export interface TopicMastery {
  topicId: string;
  masteryScore: number;
  attempts: number;
  correctCount: number;
  lastInteractionAt: string;
}

/**
 * Phase 0 in-memory progress store.
 *
 * Phase 1 swaps for Prisma against the `ProgressEvent` and `TopicMastery`
 * tables defined in `prisma/schema.prisma`. The service interface is
 * intentionally stable across that swap.
 */
@Injectable()
export class ProgressService {
  private readonly events: ProgressEvent[] = [];
  private nextId = 1;

  record(studentId: string, input: ProgressEventInputDto): ProgressEvent {
    const event: ProgressEvent = {
      id: `evt_${this.nextId++}`,
      studentId,
      occurredAt: new Date().toISOString(),
      ...input,
    };
    this.events.push(event);
    return event;
  }

  summary(studentId: string): { studentId: string; generatedAt: string; mastery: TopicMastery[] } {
    const mine = this.events.filter((e) => e.studentId === studentId);

    const byTopic = new Map<string, {
      attempts: number;
      correct: number;
      lastInteractionAt: string;
    }>();

    for (const e of mine) {
      const topicId = e.topicId;
      if (!topicId) continue;

      const m = byTopic.get(topicId) ?? { attempts: 0, correct: 0, lastInteractionAt: e.occurredAt };
      m.lastInteractionAt = e.occurredAt;
      if (e.type === "question_attempted") m.attempts++;
      if (e.type === "question_correct") {
        m.attempts++;
        m.correct++;
      }
      if (e.type === "question_incorrect") m.attempts++;
      byTopic.set(topicId, m);
    }

    const mastery: TopicMastery[] = [...byTopic.entries()].map(([topicId, m]) => ({
      topicId,
      masteryScore: m.attempts > 0 ? m.correct / m.attempts : 0,
      attempts: m.attempts,
      correctCount: m.correct,
      lastInteractionAt: m.lastInteractionAt,
    }));

    return { studentId, generatedAt: new Date().toISOString(), mastery };
  }

  /** Test/debug helper — not exposed through the controller. */
  _reset(): void {
    this.events.length = 0;
    this.nextId = 1;
  }
}

export type { ProgressEventType };
