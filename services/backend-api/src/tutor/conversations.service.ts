import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

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
 * Dual-mode conversation store:
 *  - Prisma-backed when DATABASE_URL is set (production / staging)
 *  - In-memory otherwise (local dev / demos without Postgres)
 *
 * Same external interface either way; nothing else in the app needs to
 * know which backend is active.
 */
@Injectable()
export class ConversationsService {
  static readonly HISTORY_LIMIT = 20;

  // In-memory fallback.
  private readonly byId = new Map<string, Conversation>();
  private readonly byStudent = new Map<string, string[]>();

  constructor(private readonly prisma: PrismaService) {}

  async list(studentId: string): Promise<Conversation[]> {
    if (this.prisma.enabled) {
      const rows = await this.prisma.conversation.findMany({
        where: { studentId },
        orderBy: { updatedAt: "desc" },
        include: { turns: { orderBy: { occurredAt: "asc" } } },
      });
      return rows.map(toDomain);
    }
    return (this.byStudent.get(studentId) ?? [])
      .map((id) => this.byId.get(id))
      .filter((c): c is Conversation => Boolean(c))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(studentId: string, conversationId: string): Promise<Conversation> {
    if (this.prisma.enabled) {
      const row = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { turns: { orderBy: { occurredAt: "asc" } } },
      });
      if (!row || row.studentId !== studentId) {
        throw new NotFoundException("Conversation not found");
      }
      return toDomain(row);
    }
    const c = this.byId.get(conversationId);
    if (!c || c.studentId !== studentId) {
      throw new NotFoundException("Conversation not found");
    }
    return c;
  }

  async create(studentId: string, topicId?: string): Promise<Conversation> {
    if (this.prisma.enabled) {
      const row = await this.prisma.conversation.create({
        data: { studentId, topicId: topicId ?? null },
        include: { turns: true },
      });
      return toDomain(row);
    }
    const id = `conv_${randomUUID()}`;
    const now = new Date().toISOString();
    const c: Conversation = { id, studentId, topicId, createdAt: now, updatedAt: now, turns: [] };
    this.byId.set(id, c);
    const list = this.byStudent.get(studentId) ?? [];
    list.unshift(id);
    this.byStudent.set(studentId, list);
    return c;
  }

  async appendTurn(studentId: string, conversationId: string, turn: Turn): Promise<Conversation> {
    if (this.prisma.enabled) {
      // Authorize first via get() — throws if the conversation isn't this student's.
      await this.get(studentId, conversationId);
      await this.prisma.conversationTurn.create({
        data: {
          conversationId,
          role: turn.role === "maya" ? "MAYA" : "USER",
          text: turn.text,
          occurredAt: new Date(turn.occurredAt),
          validated: turn.validated ?? null,
        },
      });
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date(turn.occurredAt) },
      });
      return this.get(studentId, conversationId);
    }
    const c = this.byId.get(conversationId);
    if (!c || c.studentId !== studentId) throw new NotFoundException("Conversation not found");
    c.turns.push(turn);
    c.updatedAt = turn.occurredAt;
    return c;
  }

  async recentTurns(studentId: string, conversationId: string): Promise<Turn[]> {
    const conv = await this.get(studentId, conversationId);
    return conv.turns.slice(-ConversationsService.HISTORY_LIMIT);
  }

  /** Test helper — only meaningful for the in-memory backend. */
  _reset(): void {
    this.byId.clear();
    this.byStudent.clear();
  }
}

// ─── helpers ──────────────────────────────────────────────────────────

interface PrismaConversationRow {
  id: string;
  studentId: string;
  topicId: string | null;
  createdAt: Date;
  updatedAt: Date;
  turns: {
    role: "USER" | "MAYA";
    text: string;
    occurredAt: Date;
    validated: boolean | null;
  }[];
}

function toDomain(row: PrismaConversationRow): Conversation {
  return {
    id: row.id,
    studentId: row.studentId,
    topicId: row.topicId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    turns: row.turns.map((t) => ({
      role: t.role === "MAYA" ? "maya" : "user",
      text: t.text,
      occurredAt: t.occurredAt.toISOString(),
      validated: t.validated ?? undefined,
    })),
  };
}
