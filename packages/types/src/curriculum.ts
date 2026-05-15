import type { Grade } from "./user";

export type ContentArea =
  | "numbers"
  | "patterns_functions_algebra"
  | "space_and_shape"
  | "measurement"
  | "data_handling";

export type Difficulty = "easy" | "medium" | "hard";

export interface TopicMetadata {
  topicId: string;
  title: string;
  grade: Grade;
  contentArea: ContentArea;
  /** CAPS reference, e.g. "Term 2, Topic 2.3". */
  capsReference: string;
  prerequisites: string[];
  learningOutcomes: string[];
  estimatedMinutes: number;
}

export interface Question {
  id: string;
  difficulty: Difficulty;
  stem: string;
  /** Canonical answer string, used for exact comparison. */
  answer: string;
  /** LaTeX representation of the answer for rendering. */
  answerLatex: string;
  solutionSteps: string[];
  commonMistakes: string[];
  tags: string[];
}

export interface QuestionBank {
  topicId: string;
  questions: Question[];
}
