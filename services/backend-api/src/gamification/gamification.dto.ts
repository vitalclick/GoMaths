import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import type { ActivityKind } from "./gamification.logic";

export class RecordActivityDto {
  @ApiProperty({
    enum: ["correct_answer", "lesson_completed"],
    description: "What the learner just did. Lessons advance the daily goal; both award XP.",
  })
  @IsIn(["correct_answer", "lesson_completed"])
  kind!: ActivityKind;
}

export class StatsViewDto {
  @ApiProperty() xp!: number;
  @ApiProperty() level!: number;
  @ApiProperty() xpIntoLevel!: number;
  @ApiProperty() xpForNextLevel!: number;
  @ApiProperty() currentStreak!: number;
  @ApiProperty() longestStreak!: number;
  @ApiProperty({ type: String, nullable: true }) lastActiveOn!: string | null;
  @ApiProperty() dailyGoal!: number;
  @ApiProperty() dailyCompleted!: number;
  @ApiProperty() dailyGoalMet!: boolean;
}
