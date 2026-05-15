import { StreakReminderTask } from "./streak-reminder.task";
import type { PrismaService } from "../prisma/prisma.service";
import type { NotificationsService } from "../notifications/notifications.service";

describe("StreakReminderTask", () => {
  it("does nothing when Prisma is disabled", async () => {
    const sent: unknown[] = [];
    const task = new StreakReminderTask(
      { enabled: false } as unknown as PrismaService,
      { send: async (i: unknown) => (sent.push(i), { delivered: 0, failed: 0 }) } as unknown as NotificationsService,
    );
    await task.run();
    expect(sent).toEqual([]);
  });

  it("sends a streak nudge to every idle student", async () => {
    const idle = [
      { userId: "u1", displayName: "Aisha Khumalo" },
      { userId: "u2", displayName: "Tom van der Merwe" },
    ];
    const findMany = jest.fn().mockResolvedValue(idle);

    const sent: { userId: string; appSlug?: string }[] = [];
    const task = new StreakReminderTask(
      {
        enabled: true,
        student: { findMany },
      } as unknown as PrismaService,
      {
        send: async (input: { userId: string; appSlug?: string }) => {
          sent.push({ userId: input.userId, appSlug: input.appSlug });
          return { delivered: 1, failed: 0 };
        },
      } as unknown as NotificationsService,
    );

    await task.run();

    expect(findMany).toHaveBeenCalledTimes(1);
    // The where clause should include a `none` filter on progressEvents
    // bounded by a 22-hour cutoff.
    const args = findMany.mock.calls[0][0];
    expect(args.where.progressEvents.none.occurredAt.gte).toBeInstanceOf(Date);

    expect(sent).toEqual([
      { userId: "u1", appSlug: "student" },
      { userId: "u2", appSlug: "student" },
    ]);
  });
});
