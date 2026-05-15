import { IsOptional, IsString, MinLength } from "class-validator";

export class TutorMessageDto {
  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class CheckAnswerDto {
  @IsString()
  questionId!: string;

  @IsString()
  answer!: string;
}
