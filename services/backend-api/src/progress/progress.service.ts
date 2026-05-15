import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
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
 * Dual-mode progress store: Prisma when DATABASE_URL is set, in-memory
 * Array otherwise.
 *
 * Mastery is computed on read in both modes. Phase 1 should add a
 * background job that materialises TopicMastery rows after each correct
 * answer, so the summary endpoint becomes O(topics) rather than
 * O(events).
 */
@Injectable()
export class ProgressService {
  // In-memory fallback.
  private readonly events: ProgressEvent[] = [];
  private nextId = 1;

  constructor(private readonly prisma: PrismaService) {}

  async record(studentId: string, input: ProgressEventInputDto): Promise<ProgressEvent> {
    if (this.prisma.enabled) {
      // Resolve studentId → Student row id (JWT carries User id).
      const student = await this.prisma.student.findUnique({
        where: { userId: studentId },
        select: { id: true },
      });
      if (!student) throw new Error(`No student profile for user ${studentId}`);

      const row = await this.prisma.progressEvent.create({
        data: {
          studentId: student.id,
          type: input.type.toUpperCase() as ProgressEventTypeDb,
          topicId: input.topicId ?? null,
          questionId: input.questionId ?? null,
          meta: input.meta ?? undefined,
        },
      });
      return {
        id: row.id,
        studentId,
        type: input.type,
        topicId: input.topicId,
        questionId: input.questionId,
        meta: input.meta,
        occurredAt: row.occurredAt.toISOString(),
      };
    }

    const event: ProgressEvent = {
      id: `evt_${this.nextId++}`,
      studentId,
      occurredAt: new Date().toISOString(),
      ...input,
    };
    this.events.push(event);
    return event;
  }

  async summary(
    studentId: string,
  ): Promise<{ studentId: string; generatedAt: string; mastery: TopicMastery[] }> {
    if (this.prisma.enabled) {
      const student = await this.prisma.student.findUnique({
        where: { userId: studentId },
        select: { id: true },
      });
      if (!student) {
        return { studentId, generatedAt: new Date().toISOString(), mastery: [] };
      }
      const events = await this.prisma.progressEvent.findMany({
        where: { studentId: student.id, topicId: { not: null } },
        select: { type: true, topicId: true, occurredAt: true },
      });
      const mastery = this.computeMastery(
        events.map((e) => ({
          type: e.type.toLowerCase() as ProgressEventType,
          topicId: e.topicId!,
          occurredAt: e.occurredAt.toISOString(),
        })),
      );
      return { studentId, generatedAt: new Date().toISOString(), mastery };
    }

    const mine = this.events
      .filter((e) => e.studentId === studentId && e.topicId)
      .map((e) => ({ type: e.type, topicId: e.topicId!, occurredAt: e.occurredAt }));
    return {
      studentId,
      generatedAt: new Date().toISOString(),
      mastery: this.computeMastery(mine),
    };
  }

  private computeMastery(
    events: { type: ProgressEventType; topicId: string; occurredAt: string }[],
  ): TopicMastery[] {
    const byTopic = new Map<string, {
      attempts: number;
      correct: number;
      lastInteractionAt: string;
    }>();

    for (const e of events) {
      const m = byTopic.get(e.topicId) ?? { attempts: 0, correct: 0, lastInteractionAt: e.occurredAt };
      m.lastInteractionAt = e.occurredAt;
      if (e.type === "question_attempted") m.attempts++;
      if (e.type === "question_correct") {
        m.attempts++;
        m.correct++;
      }
      if (e.type === "question_incorrect") m.attempts++;
      byTopic.set(e.topicId, m);
    }

    return [...byTopic.entries()].map(([topicId, m]) => ({
      topicId,
      masteryScore: m.attempts > 0 ? m.correct / m.attempts : 0,
      attempts: m.attempts,
      correctCount: m.correct,
      lastInteractionAt: m.lastInteractionAt,
    }));
  }

  /** Test helper — in-memory only. */
  _reset(): void {
    this.events.length = 0;
    this.nextId = 1;
  }
}

type ProgressEventTypeDb =
  | "LESSON_STARTED"
  | "LESSON_COMPLETED"
  | "QUESTION_ATTEMPTED"
  | "QUESTION_CORRECT"
  | "QUESTION_INCORRECT"
  | "TUTOR_MESSAGE_SENT"
  | "SOLVER_SCAN_PERFORMED";

export type { ProgressEventType };
