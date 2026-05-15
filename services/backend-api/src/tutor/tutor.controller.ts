import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { TutorService } from "./tutor.service";
import { CheckAnswerDto, TutorMessageDto } from "./tutor.dto";

@ApiTags("tutor")
@Controller()
export class TutorController {
  constructor(private readonly service: TutorService) {}

  @Post("tutor/messages")
  @ApiOperation({ summary: "Send a message to the AI tutor" })
  message(@Body() dto: TutorMessageDto) {
    return this.service.sendMessage(dto);
  }

  /**
   * Phase 0: lives on the tutor controller for convenience; in Phase 1 this
   * should move under `/api/curriculum/check` and respect auth.
   */
  @Post("curriculum/check")
  @ApiOperation({ summary: "Check a student's answer to a question" })
  check(@Body() dto: CheckAnswerDto) {
    return this.service.checkAnswer(dto.questionId, dto.answer);
  }
}
