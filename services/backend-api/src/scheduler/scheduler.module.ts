import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { NotificationsModule } from "../notifications/notifications.module";
import { StreakReminderTask } from "./streak-reminder.task";
import { LeaderService } from "./leader.service";

/**
 * Cron jobs and other scheduled tasks. Each task wraps its work in
 * `LeaderService.runIfLeader(name, ttl, fn)` so only one backend pod
 * actually fires per scheduled tick — relevant once the deployment
 * is multi-replica in af-south-1.
 */
@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule],
  providers: [LeaderService, StreakReminderTask],
  exports: [LeaderService],
})
export class SchedulerModule {}
