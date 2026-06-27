/**
 * Student-app gamification client.
 *
 * Talks to the backend gamification endpoints (XP / streak / daily goal).
 * Returns `null` when EXPO_PUBLIC_API_URL is unset (fixtures-only mode),
 * so callers can render a graceful, gamification-free fallback rather than
 * crash on a missing backend.
 */

import { authFetch } from "./auth";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export type ActivityKind = "correct_answer" | "lesson_completed";

export interface LearnerStats {
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

export async function fetchStats(): Promise<LearnerStats | null> {
  if (!apiUrl) return null;
  const res = await authFetch("/api/gamification/me");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as LearnerStats;
}

/**
 * Record an activity (awards XP, advances streak/daily goal). Best-effort:
 * never throws into the learning flow — a gamification hiccup must not block
 * answering a question. Returns the updated stats, or null if unavailable.
 */
export async function recordActivity(kind: ActivityKind): Promise<LearnerStats | null> {
  if (!apiUrl) return null;
  try {
    const res = await authFetch("/api/gamification/me/activity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    if (!res.ok) return null;
    return (await res.json()) as LearnerStats;
  } catch {
    return null;
  }
}
