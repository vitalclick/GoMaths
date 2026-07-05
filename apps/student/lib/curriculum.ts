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
import factorisationMeta from "../fixtures/g9.alg.factorisation.metadata.json";
import factorisationQuestions from "../fixtures/g9.alg.factorisation.questions.json";
import factorisationLesson from "../fixtures/g9.alg.factorisation.lesson";
import expandingMeta from "../fixtures/g9.alg.expanding.metadata.json";
import expandingQuestions from "../fixtures/g9.alg.expanding.questions.json";
import expandingLesson from "../fixtures/g9.alg.expanding.lesson";
import algebraicFractionsMeta from "../fixtures/g9.alg.algebraic-fractions.metadata.json";
import algebraicFractionsQuestions from "../fixtures/g9.alg.algebraic-fractions.questions.json";
import algebraicFractionsLesson from "../fixtures/g9.alg.algebraic-fractions.lesson";
import quadraticEqMeta from "../fixtures/g9.alg.quadratic-eq.metadata.json";
import quadraticEqQuestions from "../fixtures/g9.alg.quadratic-eq.questions.json";
import quadraticEqLesson from "../fixtures/g9.alg.quadratic-eq.lesson";
import integersMeta from "../fixtures/g9.num.integers.metadata.json";
import integersQuestions from "../fixtures/g9.num.integers.questions.json";
import integersLesson from "../fixtures/g9.num.integers.lesson";
import fractionsMeta from "../fixtures/g9.num.fractions.metadata.json";
import fractionsQuestions from "../fixtures/g9.num.fractions.questions.json";
import fractionsLesson from "../fixtures/g9.num.fractions.lesson";
import percentagesMeta from "../fixtures/g9.num.percentages.metadata.json";
import percentagesQuestions from "../fixtures/g9.num.percentages.questions.json";
import percentagesLesson from "../fixtures/g9.num.percentages.lesson";
import pythagorasMeta from "../fixtures/g9.mea.pythagoras.metadata.json";
import pythagorasQuestions from "../fixtures/g9.mea.pythagoras.questions.json";
import pythagorasLesson from "../fixtures/g9.mea.pythagoras.lesson";
import areaPerimeterMeta from "../fixtures/g9.mea.area-perimeter.metadata.json";
import areaPerimeterQuestions from "../fixtures/g9.mea.area-perimeter.questions.json";
import areaPerimeterLesson from "../fixtures/g9.mea.area-perimeter.lesson";
import anglesMeta from "../fixtures/g9.ss.angles.metadata.json";
import anglesQuestions from "../fixtures/g9.ss.angles.questions.json";
import anglesLesson from "../fixtures/g9.ss.angles.lesson";
import averagesMeta from "../fixtures/g9.dh.averages.metadata.json";
import averagesQuestions from "../fixtures/g9.dh.averages.questions.json";
import averagesLesson from "../fixtures/g9.dh.averages.lesson";
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
  { meta: linearEqMeta as FixtureMeta, questions: linearEqQuestions as FixtureQuestionsFile, lesson: linearEqLesson as unknown as string },
  { meta: exponentsMeta as FixtureMeta, questions: exponentsQuestions as FixtureQuestionsFile, lesson: exponentsLesson as unknown as string },
  { meta: factorisationMeta as FixtureMeta, questions: factorisationQuestions as FixtureQuestionsFile, lesson: factorisationLesson as unknown as string },
  { meta: expandingMeta as FixtureMeta, questions: expandingQuestions as FixtureQuestionsFile, lesson: expandingLesson as unknown as string },
  { meta: algebraicFractionsMeta as FixtureMeta, questions: algebraicFractionsQuestions as FixtureQuestionsFile, lesson: algebraicFractionsLesson as unknown as string },
  { meta: quadraticEqMeta as FixtureMeta, questions: quadraticEqQuestions as FixtureQuestionsFile, lesson: quadraticEqLesson as unknown as string },
  { meta: integersMeta as FixtureMeta, questions: integersQuestions as FixtureQuestionsFile, lesson: integersLesson as unknown as string },
  { meta: fractionsMeta as FixtureMeta, questions: fractionsQuestions as FixtureQuestionsFile, lesson: fractionsLesson as unknown as string },
  { meta: percentagesMeta as FixtureMeta, questions: percentagesQuestions as FixtureQuestionsFile, lesson: percentagesLesson as unknown as string },
  { meta: pythagorasMeta as FixtureMeta, questions: pythagorasQuestions as FixtureQuestionsFile, lesson: pythagorasLesson as unknown as string },
  { meta: areaPerimeterMeta as FixtureMeta, questions: areaPerimeterQuestions as FixtureQuestionsFile, lesson: areaPerimeterLesson as unknown as string },
  { meta: anglesMeta as FixtureMeta, questions: anglesQuestions as FixtureQuestionsFile, lesson: anglesLesson as unknown as string },
  { meta: averagesMeta as FixtureMeta, questions: averagesQuestions as FixtureQuestionsFile, lesson: averagesLesson as unknown as string },
];

// ─── Public API ───────────────────────────────────────────────────────

export async function listTopics(grade: number): Promise<TopicSummary[]> {
  const api = getClient();
  if (api) {
    const { data, error } = await api.GET("/api/curriculum/grades/{grade}", {
      params: { path: { grade } },
    });
    if (error || !data)
      throw new Error(
        `listTopics failed: ${(error as { message?: string } | undefined)?.message ?? "unknown"}`,
      );
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
    if (error || !data)
      throw new Error(
        `getTopic failed: ${(error as { message?: string } | undefined)?.message ?? "unknown"}`,
      );
    return data as Topic;
  }
  const f = FIXTURES.find((f) => f.meta.topicId === topicId);
  if (!f) throw new Error(`Unknown topic: ${topicId}`);
  return {
    ...toSummary(f),
    prerequisites: f.meta.prerequisites,
    learningOutcomes: f.meta.learningOutcomes,
    lessonMarkdown: f.lesson,
  };
}

export async function listQuestions(topicId: string): Promise<Question[]> {
  const api = getClient();
  if (api) {
    const { data, error } = await api.GET("/api/curriculum/topics/{topicId}/questions", {
      params: { path: { topicId } },
    });
    if (error || !data)
      throw new Error(
        `listQuestions failed: ${(error as { message?: string } | undefined)?.message ?? "unknown"}`,
      );
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

  const question = FIXTURES.flatMap((f) =>
    f.questions.questions.map((q) => ({ ...q, topicId: f.meta.topicId })),
  ).find((q) => q.id === questionId);
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
