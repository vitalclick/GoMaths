export type ProgressEventType =
  | "lesson_started"
  | "lesson_completed"
  | "question_attempted"
  | "question_correct"
  | "question_incorrect"
  | "tutor_message_sent"
  | "solver_scan_performed";

export interface ProgressEvent {
  id: string;
  studentId: string;
  type: ProgressEventType;
  topicId?: string;
  questionId?: string;
  /** Server timestamp (ISO 8601). */
  occurredAt: string;
  /** Free-form details, schema varies by type. */
  meta?: Record<string, unknown>;
}

export interface TopicMastery {
  studentId: string;
  topicId: string;
  /** 0..1, derived from recent question performance. */
  masteryScore: number;
  attempts: number;
  correctCount: number;
  lastInteractionAt: string;
}
