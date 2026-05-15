import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";

export const ProgressEventTypes = [
  "lesson_started",
  "lesson_completed",
  "question_attempted",
  "question_correct",
  "question_incorrect",
  "tutor_message_sent",
  "solver_scan_performed",
] as const;

export type ProgressEventType = (typeof ProgressEventTypes)[number];

export class ProgressEventInputDto {
  @IsEnum(ProgressEventTypes)
  type!: ProgressEventType;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsString()
  questionId?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
