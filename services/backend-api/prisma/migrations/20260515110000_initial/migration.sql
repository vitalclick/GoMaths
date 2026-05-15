-- Initial schema covering identity, schools/classes, curriculum,
-- progress + mastery. Conversation tables come in the next migration.
--
-- All `id` columns default to cuid()-shaped strings emitted by the Prisma
-- runtime, so the SQL just declares them TEXT NOT NULL with no default.

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM (
  'STUDENT', 'PARENT', 'TEACHER', 'SCHOOL_ADMIN', 'TUTOR', 'INTERNAL_ADMIN'
);
CREATE TYPE "Language" AS ENUM ('EN', 'AF', 'ZU', 'ST', 'XH');
CREATE TYPE "ContentArea" AS ENUM (
  'NUMBERS', 'PATTERNS_FUNCTIONS_ALGEBRA', 'SPACE_AND_SHAPE',
  'MEASUREMENT', 'DATA_HANDLING'
);
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE "ProgressEventType" AS ENUM (
  'LESSON_STARTED', 'LESSON_COMPLETED', 'QUESTION_ATTEMPTED',
  'QUESTION_CORRECT', 'QUESTION_INCORRECT', 'TUTOR_MESSAGE_SENT',
  'SOLVER_SCAN_PERFORMED'
);

-- Users + identity
CREATE TABLE "User" (
  "id"           TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role"         "UserRole" NOT NULL,
  "language"     "Language" NOT NULL DEFAULT 'EN',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

CREATE TABLE "Session" (
  "id"               TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "expiresAt"        TIMESTAMP(3) NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt"        TIMESTAMP(3),
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Session_refreshTokenHash_key"
  ON "Session"("refreshTokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

CREATE TABLE "Student" (
  "id"                TEXT NOT NULL,
  "userId"            TEXT NOT NULL,
  "displayName"       TEXT NOT NULL,
  "grade"             INTEGER NOT NULL,
  "schoolId"          TEXT,
  "parentalConsentAt" TIMESTAMP(3),
  CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE INDEX "Student_grade_idx" ON "Student"("grade");
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");

CREATE TABLE "Parent" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent"("userId");

CREATE TABLE "Teacher" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "saceNumber"  TEXT NOT NULL,
  "schoolId"    TEXT NOT NULL,
  CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");
CREATE UNIQUE INDEX "Teacher_saceNumber_key" ON "Teacher"("saceNumber");
CREATE INDEX "Teacher_schoolId_idx" ON "Teacher"("schoolId");

CREATE TABLE "StudentParent" (
  "studentId" TEXT NOT NULL,
  "parentId"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentParent_pkey" PRIMARY KEY ("studentId", "parentId")
);
CREATE INDEX "StudentParent_parentId_idx" ON "StudentParent"("parentId");

-- Schools + classes
CREATE TABLE "School" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "province"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Class" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "grade"     INTEGER NOT NULL,
  "schoolId"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");
CREATE INDEX "Class_grade_idx" ON "Class"("grade");

CREATE TABLE "TeacherClass" (
  "teacherId" TEXT NOT NULL,
  "classId"   TEXT NOT NULL,
  CONSTRAINT "TeacherClass_pkey" PRIMARY KEY ("teacherId", "classId")
);
CREATE INDEX "TeacherClass_classId_idx" ON "TeacherClass"("classId");

CREATE TABLE "ClassEnrollment" (
  "studentId"  TEXT NOT NULL,
  "classId"    TEXT NOT NULL,
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("studentId", "classId")
);
CREATE INDEX "ClassEnrollment_classId_idx" ON "ClassEnrollment"("classId");

-- Curriculum (content IDs are content-addressable strings, not cuids)
CREATE TABLE "Topic" (
  "id"               TEXT NOT NULL,
  "title"            TEXT NOT NULL,
  "grade"            INTEGER NOT NULL,
  "contentArea"      "ContentArea" NOT NULL,
  "capsReference"    TEXT NOT NULL,
  "learningOutcomes" TEXT[],
  "estimatedMinutes" INTEGER NOT NULL,
  "lessonMarkdown"   TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Topic_grade_contentArea_idx" ON "Topic"("grade", "contentArea");

CREATE TABLE "TopicPrerequisite" (
  "topicId"        TEXT NOT NULL,
  "prerequisiteId" TEXT NOT NULL,
  CONSTRAINT "TopicPrerequisite_pkey" PRIMARY KEY ("topicId", "prerequisiteId")
);
CREATE INDEX "TopicPrerequisite_prerequisiteId_idx"
  ON "TopicPrerequisite"("prerequisiteId");

CREATE TABLE "Question" (
  "id"             TEXT NOT NULL,
  "topicId"        TEXT NOT NULL,
  "difficulty"     "Difficulty" NOT NULL,
  "stem"           TEXT NOT NULL,
  "answer"         TEXT NOT NULL,
  "answerLatex"    TEXT NOT NULL,
  "solutionSteps"  TEXT[],
  "commonMistakes" TEXT[],
  "tags"           TEXT[],
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Question_topicId_difficulty_idx"
  ON "Question"("topicId", "difficulty");

-- Progress
CREATE TABLE "ProgressEvent" (
  "id"         TEXT NOT NULL,
  "studentId"  TEXT NOT NULL,
  "type"       "ProgressEventType" NOT NULL,
  "topicId"    TEXT,
  "questionId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta"       JSONB,
  CONSTRAINT "ProgressEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProgressEvent_studentId_occurredAt_idx"
  ON "ProgressEvent"("studentId", "occurredAt");
CREATE INDEX "ProgressEvent_topicId_idx" ON "ProgressEvent"("topicId");

CREATE TABLE "TopicMastery" (
  "studentId"         TEXT NOT NULL,
  "topicId"           TEXT NOT NULL,
  "masteryScore"      DOUBLE PRECISION NOT NULL,
  "attempts"          INTEGER NOT NULL DEFAULT 0,
  "correctCount"      INTEGER NOT NULL DEFAULT 0,
  "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TopicMastery_pkey" PRIMARY KEY ("studentId", "topicId")
);
CREATE INDEX "TopicMastery_studentId_idx" ON "TopicMastery"("studentId");

-- Foreign keys
ALTER TABLE "Student"
  ADD CONSTRAINT "Student_userId_fkey"   FOREIGN KEY ("userId")   REFERENCES "User"("id")   ON DELETE CASCADE,
  ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL;
ALTER TABLE "Parent"
  ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Teacher"
  ADD CONSTRAINT "Teacher_userId_fkey"   FOREIGN KEY ("userId")   REFERENCES "User"("id")   ON DELETE CASCADE,
  ADD CONSTRAINT "Teacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id");
ALTER TABLE "StudentParent"
  ADD CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "StudentParent_parentId_fkey"  FOREIGN KEY ("parentId")  REFERENCES "Parent"("id")  ON DELETE CASCADE;
ALTER TABLE "Class"
  ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE;
ALTER TABLE "TeacherClass"
  ADD CONSTRAINT "TeacherClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "TeacherClass_classId_fkey"   FOREIGN KEY ("classId")   REFERENCES "Class"("id")   ON DELETE CASCADE;
ALTER TABLE "ClassEnrollment"
  ADD CONSTRAINT "ClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "ClassEnrollment_classId_fkey"   FOREIGN KEY ("classId")   REFERENCES "Class"("id")   ON DELETE CASCADE;
ALTER TABLE "TopicPrerequisite"
  ADD CONSTRAINT "TopicPrerequisite_topicId_fkey"        FOREIGN KEY ("topicId")        REFERENCES "Topic"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "TopicPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Topic"("id") ON DELETE CASCADE;
ALTER TABLE "Question"
  ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE;
ALTER TABLE "ProgressEvent"
  ADD CONSTRAINT "ProgressEvent_studentId_fkey"  FOREIGN KEY ("studentId")  REFERENCES "Student"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "ProgressEvent_topicId_fkey"    FOREIGN KEY ("topicId")    REFERENCES "Topic"("id"),
  ADD CONSTRAINT "ProgressEvent_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id");
ALTER TABLE "TopicMastery"
  ADD CONSTRAINT "TopicMastery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "TopicMastery_topicId_fkey"   FOREIGN KEY ("topicId")   REFERENCES "Topic"("id")   ON DELETE CASCADE;
