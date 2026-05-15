/**
 * Internal shapes used by the curriculum service. The wire DTOs match the
 * OpenAPI spec (`openapi.yaml`) and are kept separate to allow internal
 * evolution without breaking the API contract.
 */

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
  grade: number;
  contentArea: ContentArea;
  capsReference: string;
  prerequisites: string[];
  learningOutcomes: string[];
  estimatedMinutes: number;
}

export interface Topic extends TopicMetadata {
  lessonMarkdown: string;
}

export interface TopicSummary {
  topicId: string;
  title: string;
  grade: number;
  contentArea: ContentArea;
  capsReference: string;
  estimatedMinutes: number;
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
