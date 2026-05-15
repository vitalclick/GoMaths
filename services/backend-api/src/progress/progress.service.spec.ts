import { ProgressService } from "./progress.service";
import type { PrismaService } from "../prisma/prisma.service";

function makeService(): ProgressService {
  const prismaStub = { enabled: false } as unknown as PrismaService;
  return new ProgressService(prismaStub);
}

describe("ProgressService (in-memory)", () => {
  it("records events and assigns ids", async () => {
    const service = makeService();
    const e = await service.record("s1", { type: "lesson_started", topicId: "g9.alg.linear-eq" });
    expect(e.id).toBe("evt_1");
    expect(e.studentId).toBe("s1");
    expect(e.occurredAt).toBeTruthy();
  });

  it("computes mastery from correct/incorrect events", async () => {
    const service = makeService();
    await service.record("s1", { type: "question_correct", topicId: "g9.alg.linear-eq" });
    await service.record("s1", { type: "question_correct", topicId: "g9.alg.linear-eq" });
    await service.record("s1", { type: "question_incorrect", topicId: "g9.alg.linear-eq" });

    const summary = await service.summary("s1");
    expect(summary.mastery).toHaveLength(1);
    expect(summary.mastery[0]).toMatchObject({
      topicId: "g9.alg.linear-eq",
      attempts: 3,
      correctCount: 2,
    });
    expect(summary.mastery[0].masteryScore).toBeCloseTo(2 / 3);
  });

  it("isolates students from each other", async () => {
    const service = makeService();
    await service.record("s1", { type: "question_correct", topicId: "t" });
    await service.record("s2", { type: "question_incorrect", topicId: "t" });

    expect((await service.summary("s1")).mastery[0].correctCount).toBe(1);
    expect((await service.summary("s2")).mastery[0].correctCount).toBe(0);
  });
});
