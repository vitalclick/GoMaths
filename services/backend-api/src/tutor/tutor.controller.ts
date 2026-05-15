import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TutorService } from "./tutor.service";
import { CheckAnswerDto, TutorMessageDto } from "./tutor.dto";
import { CurrentUser, type JwtClaims } from "../auth/auth.guard";

@ApiTags("tutor")
@ApiBearerAuth()
@Controller()
export class TutorController {
  constructor(private readonly service: TutorService) {}

  @Post("tutor/messages")
  @ApiOperation({ summary: "Send a message to the AI tutor" })
  message(@CurrentUser() user: JwtClaims, @Body() dto: TutorMessageDto) {
    return this.service.sendMessage(user.sub, dto);
  }

  /**
   * Phase 0+ home: lives on the tutor controller for convenience; Phase 1
   * should move this to /api/curriculum/check on the curriculum controller.
   */
  @Post("curriculum/check")
  @ApiOperation({ summary: "Check a student's answer to a question" })
  check(@CurrentUser() user: JwtClaims, @Body() dto: CheckAnswerDto) {
    return this.service.checkAnswer(user.sub, dto.questionId, dto.answer);
  }
}
