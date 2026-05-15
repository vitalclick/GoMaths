import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

export interface Turn {
  role: "user" | "maya";
  text: string;
  occurredAt: string;
  validated?: boolean;
}

export interface Conversation {
  id: string;
  studentId: string;
  topicId?: string;
  createdAt: string;
  updatedAt: string;
  turns: Turn[];
}

/**
 * Phase 0+ in-memory conversation store. Phase 1 swaps for Prisma against
 * a `Conversation` + `ConversationTurn` model that mirrors this shape.
 *
 * Each conversation belongs to exactly one student. Cross-conversation
 * access is rejected at the service boundary, not just by query filter,
 * so a stale or guessed conversation id can't leak another student's
 * chat history.
 */
@Injectable()
export class ConversationsService {
  /** Per-message context window passed to the LLM. Keeps requests cheap. */
  static readonly HISTORY_LIMIT = 20;

  private readonly byId = new Map<string, Conversation>();
  private readonly byStudent = new Map<string, string[]>();

  list(studentId: string): Conversation[] {
    return (this.byStudent.get(studentId) ?? [])
      .map((id) => this.byId.get(id))
      .filter((c): c is Conversation => Boolean(c))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(studentId: string, conversationId: string): Conversation {
    const c = this.byId.get(conversationId);
    if (!c || c.studentId !== studentId) {
      throw new NotFoundException("Conversation not found");
    }
    return c;
  }

  create(studentId: string, topicId?: string): Conversation {
    const id = `conv_${randomUUID()}`;
    const now = new Date().toISOString();
    const c: Conversation = {
      id,
      studentId,
      topicId,
      createdAt: now,
      updatedAt: now,
      turns: [],
    };
    this.byId.set(id, c);
    const list = this.byStudent.get(studentId) ?? [];
    list.unshift(id);
    this.byStudent.set(studentId, list);
    return c;
  }

  appendTurn(studentId: string, conversationId: string, turn: Turn): Conversation {
    const c = this.get(studentId, conversationId);
    c.turns.push(turn);
    c.updatedAt = turn.occurredAt;
    return c;
  }

  /** Return the last N turns formatted for the LLM. */
  recentTurns(studentId: string, conversationId: string): Turn[] {
    const c = this.get(studentId, conversationId);
    return c.turns.slice(-ConversationsService.HISTORY_LIMIT);
  }

  /** Test helper. */
  _reset(): void {
    this.byId.clear();
    this.byStudent.clear();
  }
}
