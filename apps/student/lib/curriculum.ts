/**
 * Curriculum data client.
 *
 * Two modes, controlled by `EXPO_PUBLIC_API_URL`:
 *
 *  - If set: HTTP-fetch from the backend (`@gomaths/backend-api`).
 *  - If unset (default): use bundled JSON fixtures imported below. This
 *    lets the app run as a standalone demo without any backend running.
 *
 * Both modes return the same shapes so screens don't care which is active.
 */

import linearEqMeta from "../fixtures/g9.alg.linear-eq.metadata.json";
import linearEqQuestions from "../fixtures/g9.alg.linear-eq.questions.json";
import linearEqLesson from "../fixtures/g9.alg.linear-eq.lesson";
import exponentsMeta from "../fixtures/g9.alg.exponents.metadata.json";
import exponentsQuestions from "../fixtures/g9.alg.exponents.questions.json";
import exponentsLesson from "../fixtures/g9.alg.exponents.lesson";
import { authFetch } from "./auth";
import { getClient } from "./api";

export type ContentArea =
  | "numbers"
  | "patterns_functions_algebra"
  | "space_and_shape"
  | "measurement"
  | "data_handling";

export type Difficulty = "easy" | "medium" | "hard";

export interface TopicSummary {
  topicId: string;
  title: string;
  grade: number;
  contentArea: ContentArea;
  capsReference: string;
  estimatedMinutes: number;
}

export interface Topic extends TopicSummary {
  prerequisites: string[];
  learningOutcomes: string[];
  lessonMarkdown: string;
}

export interface Question {
  id: string;
  topicId: string;
  difficulty: Difficulty;
  stem: string;
  answer: string;
  answerLatex: string;
  solutionSteps: string[];
  commonMistakes: string[];
  tags: string[];
}

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// ─── Bundled fixtures (used when the backend isn't available) ─────────

interface FixtureMeta {
  topicId: string;
  title: string;
  grade: number;
  contentArea: ContentArea;
  capsReference: string;
  prerequisites: string[];
  learningOutcomes: string[];
  estimatedMinutes: number;
}

interface FixtureQuestionsFile {
  topicId: string;
  questions: Omit<Question, "topicId">[];
}

const FIXTURES: { meta: FixtureMeta; questions: FixtureQuestionsFile; lesson: string }[] = [
  {
    meta: linearEqMeta as FixtureMeta,
    questions: linearEqQuestions as FixtureQuestionsFile,
    lesson: linearEqLesson as unknown as string,
  },
  {
    meta: exponentsMeta as FixtureMeta,
    questions: exponentsQuestions as FixtureQuestionsFile,
    lesson: exponentsLesson as unknown as string,
  },
];

// ─── Public API ───────────────────────────────────────────────────────

export async function listTopics(grade: number): Promise<TopicSummary[]> {
  const api = getClient();
  if (api) {
    const { data, error } = await api.GET("/api/curriculum/grades/{grade}", {
      params: { path: { grade } },
    });
    if (error || !data) throw new Error(`listTopics failed: ${(error as { message?: string } | undefined)?.message ?? "unknown"}`);
    return data as TopicSummary[];
  }
  return FIXTURES.filter((f) => f.meta.grade === grade).map(toSummary);
}

export async function getTopic(topicId: string): Promise<Topic> {
  const api = getClient();
  if (api) {
    const { data, error } = await api.GET("/api/curriculum/topics/{topicId}", {
      params: { path: { topicId } },
    });
    if (error || !data) throw new Error(`getTopic failed: ${(error as { message?: string } | undefined)?.message ?? "unknown"}`);
    return data as Topic;
  }
  const f = FIXTURES.find((f) => f.meta.topicId === topicId);
  if (!f) throw new Error(`Unknown topic: ${topicId}`);
  return { ...toSummary(f), prerequisites: f.meta.prerequisites, learningOutcomes: f.meta.learningOutcomes, lessonMarkdown: f.lesson };
}

export async function listQuestions(topicId: string): Promise<Question[]> {
  const api = getClient();
  if (api) {
    const { data, error } = await api.GET("/api/curriculum/topics/{topicId}/questions", {
      params: { path: { topicId } },
    });
    if (error || !data) throw new Error(`listQuestions failed: ${(error as { message?: string } | undefined)?.message ?? "unknown"}`);
    return data as Question[];
  }
  const f = FIXTURES.find((f) => f.meta.topicId === topicId);
  if (!f) throw new Error(`Unknown topic: ${topicId}`);
  return f.questions.questions.map((q) => ({ ...q, topicId: f.meta.topicId }));
}

export interface CheckResult {
  questionId: string;
  correct: boolean;
  validated: boolean;
  expected: string;
}

/**
 * Check a student's answer.
 *
 * When the backend is reachable, this hits POST /api/curriculum/check,
 * which runs through the real SymPy validator. Without the backend,
 * we fall back to normalized string comparison — correct for ~80% of
 * Grade 9 question types, but no symbolic equivalence.
 */
export async function checkAnswer(questionId: string, answer: string): Promise<CheckResult> {
  if (apiUrl) {
    const res = await authFetch(`/api/curriculum/check`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionId, answer }),
    });
    if (!res.ok) throw new Error(`checkAnswer failed: ${res.status}`);
    return (await res.json()) as CheckResult;
  }

  const question = FIXTURES.flatMap((f) => f.questions.questions.map((q) => ({ ...q, topicId: f.meta.topicId }))).find(
    (q) => q.id === questionId,
  );
  if (!question) throw new Error(`Unknown question: ${questionId}`);
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return {
    questionId,
    correct: normalize(answer) === normalize(question.answer),
    validated: false, // fixtures-only mode can't claim symbolic validation
    expected: question.answer,
  };
}

function toSummary(f: { meta: FixtureMeta }): TopicSummary {
  return {
    topicId: f.meta.topicId,
    title: f.meta.title,
    grade: f.meta.grade,
    contentArea: f.meta.contentArea,
    capsReference: f.meta.capsReference,
    estimatedMinutes: f.meta.estimatedMinutes,
  };
}
