import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  applyActivity,
  freshState,
  viewFor,
  type ActivityKind,
  type StatsState,
  type StatsView,
} from "./gamification.logic";

/**
 * Dual-mode gamification store: Prisma `LearnerStats` when DATABASE_URL is
 * set, an in-memory Map otherwise (mirrors users/progress services). All
 * XP/streak/daily-goal arithmetic lives in gamification.logic (pure +
 * unit-tested); this layer only loads, applies, and persists.
 */
@Injectable()
export class GamificationService {
  private readonly memory = new Map<string, StatsState>();

  constructor(private readonly prisma: PrismaService) {}

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Read the current learner's stats view (creating defaults if absent). */
  async getStats(userId: string): Promise<StatsView> {
    const state = await this.load(userId);
    return viewFor(state, this.today());
  }

  /** Apply one activity and return the updated stats view. */
  async recordActivity(userId: string, kind: ActivityKind): Promise<StatsView> {
    const current = await this.load(userId);
    const next = applyActivity(current, kind, this.today());
    await this.save(userId, next);
    return viewFor(next, this.today());
  }

  // ── persistence ────────────────────────────────────────────────────

  private async load(userId: string): Promise<StatsState> {
    if (!this.prisma.enabled) {
      return this.memory.get(userId) ?? freshState();
    }
    const studentId = await this.studentId(userId);
    const row = await this.prisma.learnerStats.findUnique({ where: { studentId } });
    if (!row) return freshState();
    return {
      xp: row.xp,
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      lastActiveOn: row.lastActiveOn ? row.lastActiveOn.toISOString().slice(0, 10) : null,
      dailyDate: row.dailyDate ? row.dailyDate.toISOString().slice(0, 10) : null,
      dailyCount: row.dailyCount,
      dailyGoal: row.dailyGoal,
    };
  }

  private async save(userId: string, state: StatsState): Promise<void> {
    if (!this.prisma.enabled) {
      this.memory.set(userId, state);
      return;
    }
    const studentId = await this.studentId(userId);
    const data = {
      xp: state.xp,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastActiveOn: state.lastActiveOn ? new Date(`${state.lastActiveOn}T00:00:00Z`) : null,
      dailyDate: state.dailyDate ? new Date(`${state.dailyDate}T00:00:00Z`) : null,
      dailyCount: state.dailyCount,
      dailyGoal: state.dailyGoal,
    };
    await this.prisma.learnerStats.upsert({
      where: { studentId },
      create: { studentId, ...data },
      update: data,
    });
  }

  /** JWT carries the User id; gamification rows hang off the Student row. */
  private async studentId(userId: string): Promise<string> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!student) throw new NotFoundException(`No student profile for user ${userId}`);
    return student.id;
  }
}
