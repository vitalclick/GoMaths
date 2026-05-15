import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LeaderService } from "./leader.service";

/**
 * Daily streak reminder.
 *
 * Runs at 18:00 in the server's timezone (set TZ=Africa/Johannesburg
 * in production). Finds every student who hasn't recorded any progress
 * event in the last 22 hours, and pushes a friendly nudge to their
 * Student-app devices.
 *
 * 22 hours (vs. 24) is a deliberate buffer: a learner who studied
 * yesterday at 19:00 shouldn't get a reminder at 18:00 today saying
 * "you missed yesterday" when they just studied 23 hours ago. The
 * window slides.
 *
 * Phase 1 expansions (when the data model supports them):
 *   - Honour a per-student preferred reminder time
 *   - Skip students who opted out (preferences row)
 *   - Different copy for "first reminder" vs. "you're 5 days strong"
 *   - Weekly digest for parents (separate task, same scheduler)
 */
@Injectable()
export class StreakReminderTask {
  private static readonly QUIET_WINDOW_HOURS = 22;
  private readonly logger = new Logger(StreakReminderTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly leader: LeaderService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6PM, { name: "streak-reminder" })
  async run(): Promise<void> {
    if (!this.prisma.enabled) {
      this.logger.warn("Skipping streak reminder — Prisma not enabled");
      return;
    }
    // Initial 30-minute lock; LeaderService heartbeats every 10 minutes
    // (ttlMs/3) so a slow fan-out across hundreds of thousands of
    // students cannot let another pod claim the lock mid-run.
    await this.leader.runIfLeader("streak-reminder", 30 * 60_000, () => this.doRun());
  }

  private async doRun(): Promise<void> {
    const cutoff = new Date(Date.now() - StreakReminderTask.QUIET_WINDOW_HOURS * 3600_000);

    // Students with NO progress event since `cutoff`. Selecting only the
    // userId we need for the push call.
    const idle = await this.prisma.student.findMany({
      where: {
        progressEvents: { none: { occurredAt: { gte: cutoff } } },
      },
      select: { userId: true, displayName: true },
    });

    this.logger.log(`Streak reminder: ${idle.length} student(s) eligible`);

    let delivered = 0;
    let failed = 0;
    for (const student of idle) {
      const r = await this.notifications.send({
        userId: student.userId,
        title: "Maya misses you 👋",
        body: `Five minutes of practice keeps your streak alive, ${student.displayName.split(" ")[0]}.`,
        appSlug: "student",
        data: { kind: "streak-reminder" },
      });
      delivered += r.delivered;
      failed += r.failed;
    }

    this.logger.log(`Streak reminder: delivered=${delivered} failed=${failed}`);
  }
}
