import {
  applyActivity,
  dayDiff,
  freshState,
  levelForXp,
  rollDaily,
  rollStreak,
  viewFor,
  XP_PER_CORRECT_ANSWER,
  XP_PER_LESSON_COMPLETED,
} from "./gamification.logic";

describe("levelForXp", () => {
  it("places XP on the quadratic curve", () => {
    expect(levelForXp(0).level).toBe(0);
    expect(levelForXp(100).level).toBe(1);
    expect(levelForXp(400).level).toBe(2);
    expect(levelForXp(900).level).toBe(3);
  });

  it("reports progress within the current level", () => {
    const v = levelForXp(1240);
    expect(v.level).toBe(3); // 900 <= 1240 < 1600
    expect(v.xpIntoLevel).toBe(340);
    expect(v.xpForNextLevel).toBe(700); // 1600 - 900
  });
});

describe("dayDiff", () => {
  it("counts whole days between ISO dates", () => {
    expect(dayDiff("2026-06-27", "2026-06-27")).toBe(0);
    expect(dayDiff("2026-06-27", "2026-06-28")).toBe(1);
    expect(dayDiff("2026-06-27", "2026-07-01")).toBe(4);
  });
});

describe("rollStreak", () => {
  it("starts at 1 on first activity", () => {
    expect(rollStreak(freshState(), "2026-06-27").currentStreak).toBe(1);
  });

  it("does not double-count the same day", () => {
    const s = { ...freshState(), currentStreak: 3, longestStreak: 5, lastActiveOn: "2026-06-27" };
    expect(rollStreak(s, "2026-06-27").currentStreak).toBe(3);
  });

  it("increments on a consecutive day", () => {
    const s = { ...freshState(), currentStreak: 3, longestStreak: 5, lastActiveOn: "2026-06-27" };
    const next = rollStreak(s, "2026-06-28");
    expect(next.currentStreak).toBe(4);
    expect(next.longestStreak).toBe(5);
  });

  it("resets after a missed day and tracks the longest", () => {
    const s = { ...freshState(), currentStreak: 9, longestStreak: 9, lastActiveOn: "2026-06-27" };
    const next = rollStreak(s, "2026-06-30");
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(9);
  });
});

describe("rollDaily", () => {
  it("accumulates within a day", () => {
    const s = { ...freshState(), dailyDate: "2026-06-27", dailyCount: 2 };
    expect(rollDaily(s, "2026-06-27", 1).dailyCount).toBe(3);
  });

  it("resets the counter on a new day", () => {
    const s = { ...freshState(), dailyDate: "2026-06-27", dailyCount: 4 };
    expect(rollDaily(s, "2026-06-28", 1).dailyCount).toBe(1);
  });
});

describe("applyActivity", () => {
  it("awards XP per activity kind", () => {
    const a = applyActivity(freshState(), "correct_answer", "2026-06-27");
    expect(a.xp).toBe(XP_PER_CORRECT_ANSWER);
    const b = applyActivity(a, "lesson_completed", "2026-06-27");
    expect(b.xp).toBe(XP_PER_CORRECT_ANSWER + XP_PER_LESSON_COMPLETED);
  });

  it("only lessons advance the daily goal", () => {
    let s = freshState(3);
    s = applyActivity(s, "correct_answer", "2026-06-27");
    expect(viewFor(s, "2026-06-27").dailyCompleted).toBe(0);
    s = applyActivity(s, "lesson_completed", "2026-06-27");
    expect(viewFor(s, "2026-06-27").dailyCompleted).toBe(1);
  });
});

describe("viewFor", () => {
  it("marks the daily goal met and resets across days", () => {
    let s = freshState(2);
    s = applyActivity(s, "lesson_completed", "2026-06-27");
    s = applyActivity(s, "lesson_completed", "2026-06-27");
    expect(viewFor(s, "2026-06-27").dailyGoalMet).toBe(true);
    // Next day, the daily counter is stale → shows 0 completed.
    expect(viewFor(s, "2026-06-28").dailyCompleted).toBe(0);
    expect(viewFor(s, "2026-06-28").dailyGoalMet).toBe(false);
  });
});
