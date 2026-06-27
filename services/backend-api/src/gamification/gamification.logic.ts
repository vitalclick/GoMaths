/**
 * Pure gamification logic — XP/levels, streaks, daily goals.
 *
 * No Nest, no Prisma, no I/O: every function is a deterministic transform
 * of plain data, so it is fully unit-testable without a database (the
 * service layer wires this into Prisma / the in-memory store). Splitting it
 * out keeps the rules that actually matter verifiable in isolation.
 */

/** Persistable learner gamification state (mode-agnostic). */
export interface StatsState {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  /** ISO date (YYYY-MM-DD) of the last active day, or null if never active. */
  lastActiveOn: string | null;
  /** ISO date the daily counter applies to. */
  dailyDate: string | null;
  /** Lessons completed on `dailyDate`. */
  dailyCount: number;
  /** Lessons-per-day target. */
  dailyGoal: number;
}

export const DEFAULT_DAILY_GOAL = 5;
export const XP_PER_CORRECT_ANSWER = 10;
export const XP_PER_LESSON_COMPLETED = 50;

export type ActivityKind = "correct_answer" | "lesson_completed";

export function freshState(dailyGoal: number = DEFAULT_DAILY_GOAL): StatsState {
  return {
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveOn: null,
    dailyDate: null,
    dailyCount: 0,
    dailyGoal,
  };
}

/** XP awarded for a single activity. */
export function xpForActivity(kind: ActivityKind): number {
  return kind === "lesson_completed" ? XP_PER_LESSON_COMPLETED : XP_PER_CORRECT_ANSWER;
}

/**
 * Level curve: cumulative XP to *reach* level L is `100 * L^2`. So level 1
 * at 100xp, level 2 at 400, level 3 at 900, level 5 at 2500 — a gentle
 * quadratic ramp that keeps early levels fast and later ones meaningful.
 */
export function levelForXp(xp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = Math.floor(Math.sqrt(safeXp / 100));
  const floorXp = 100 * level * level;
  const nextXp = 100 * (level + 1) * (level + 1);
  return {
    level,
    xpIntoLevel: safeXp - floorXp,
    xpForNextLevel: nextXp - floorXp,
  };
}

/** Whole-day difference b - a for two ISO dates (YYYY-MM-DD). */
export function dayDiff(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/**
 * Advance the streak for activity happening on `today`:
 *  - same day as last active   → unchanged
 *  - exactly the next day       → +1
 *  - any larger gap (or first)  → reset to 1
 * `longestStreak` only ever grows.
 */
export function rollStreak(
  state: StatsState,
  today: string,
): Pick<StatsState, "currentStreak" | "longestStreak" | "lastActiveOn"> {
  let current: number;
  if (state.lastActiveOn === null) {
    current = 1;
  } else {
    const gap = dayDiff(state.lastActiveOn, today);
    if (gap === 0)
      current = state.currentStreak; // already counted today
    else if (gap === 1) current = state.currentStreak + 1;
    else current = 1; // missed a day (or clock moved backwards)
  }
  return {
    currentStreak: current,
    longestStreak: Math.max(state.longestStreak, current),
    lastActiveOn: today,
  };
}

/** Roll the daily lesson counter, resetting it when the day changes. */
export function rollDaily(
  state: StatsState,
  today: string,
  lessonsDelta: number,
): Pick<StatsState, "dailyDate" | "dailyCount"> {
  const sameDay = state.dailyDate === today;
  return {
    dailyDate: today,
    dailyCount: (sameDay ? state.dailyCount : 0) + Math.max(0, lessonsDelta),
  };
}

/**
 * Apply one activity to a state and return the next state. Pure: callers
 * persist the result.
 */
export function applyActivity(state: StatsState, kind: ActivityKind, today: string): StatsState {
  const streak = rollStreak(state, today);
  const daily = rollDaily(state, today, kind === "lesson_completed" ? 1 : 0);
  return {
    ...state,
    ...streak,
    ...daily,
    xp: Math.max(0, Math.floor(state.xp)) + xpForActivity(kind),
  };
}

/** A read-model view of the state for the API, computed for `today`. */
export interface StatsView {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveOn: string | null;
  dailyGoal: number;
  dailyCompleted: number;
  dailyGoalMet: boolean;
}

export function viewFor(state: StatsState, today: string): StatsView {
  const lvl = levelForXp(state.xp);
  // The stored daily counter only counts if it belongs to `today`.
  const dailyCompleted = state.dailyDate === today ? state.dailyCount : 0;
  return {
    xp: state.xp,
    level: lvl.level,
    xpIntoLevel: lvl.xpIntoLevel,
    xpForNextLevel: lvl.xpForNextLevel,
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    lastActiveOn: state.lastActiveOn,
    dailyGoal: state.dailyGoal,
    dailyCompleted,
    dailyGoalMet: dailyCompleted >= state.dailyGoal,
  };
}
