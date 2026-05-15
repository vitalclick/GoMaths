import { ProgressService } from "./progress.service";

describe("ProgressService", () => {
  let service: ProgressService;

  beforeEach(() => {
    service = new ProgressService();
  });

  it("records events and assigns ids", () => {
    const e = service.record("s1", { type: "lesson_started", topicId: "g9.alg.linear-eq" });
    expect(e.id).toBe("evt_1");
    expect(e.studentId).toBe("s1");
    expect(e.occurredAt).toBeTruthy();
  });

  it("computes mastery from correct/incorrect events", () => {
    service.record("s1", { type: "question_correct", topicId: "g9.alg.linear-eq" });
    service.record("s1", { type: "question_correct", topicId: "g9.alg.linear-eq" });
    service.record("s1", { type: "question_incorrect", topicId: "g9.alg.linear-eq" });

    const summary = service.summary("s1");
    expect(summary.mastery).toHaveLength(1);
    expect(summary.mastery[0]).toMatchObject({
      topicId: "g9.alg.linear-eq",
      attempts: 3,
      correctCount: 2,
    });
    expect(summary.mastery[0].masteryScore).toBeCloseTo(2 / 3);
  });

  it("isolates students from each other", () => {
    service.record("s1", { type: "question_correct", topicId: "t" });
    service.record("s2", { type: "question_incorrect", topicId: "t" });

    expect(service.summary("s1").mastery[0].correctCount).toBe(1);
    expect(service.summary("s2").mastery[0].correctCount).toBe(0);
  });
});
