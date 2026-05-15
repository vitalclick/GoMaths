import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { NotificationsModule } from "../notifications/notifications.module";
import { StreakReminderTask } from "./streak-reminder.task";

/**
 * Cron jobs and other scheduled tasks. Add new tasks as @Injectable
 * classes with @Cron methods, then list them in `providers` here.
 *
 * Phase 1: ensure only one pod runs each task in production. Either:
 *   - mark some pods as the "scheduler pod" via env (SCHEDULER_ENABLED=1)
 *   - or use Redis-backed leader election (e.g. via the Redis we already
 *     have for the throttler)
 */
@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule],
  providers: [StreakReminderTask],
})
export class SchedulerModule {}
