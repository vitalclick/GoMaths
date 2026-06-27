-- Gamification state for a learner: XP, streaks and the daily lesson goal.
-- One row per student (unique studentId). All arithmetic is computed in the
-- application layer (gamification.logic.ts); this table just persists state.

CREATE TABLE "LearnerStats" (
  "id"            TEXT NOT NULL,
  "studentId"     TEXT NOT NULL,
  "xp"            INTEGER NOT NULL DEFAULT 0,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "lastActiveOn"  TIMESTAMP(3),
  "dailyDate"     TIMESTAMP(3),
  "dailyCount"    INTEGER NOT NULL DEFAULT 0,
  "dailyGoal"     INTEGER NOT NULL DEFAULT 5,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LearnerStats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearnerStats_studentId_key" ON "LearnerStats"("studentId");

ALTER TABLE "LearnerStats"
  ADD CONSTRAINT "LearnerStats_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE;
