import { Body, Controller, Get, Param, Post, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { TutorService } from "./tutor.service";
import { CheckAnswerDto, TutorMessageDto } from "./tutor.dto";
import { CurrentUser, type JwtClaims } from "../auth/auth.guard";

@ApiTags("tutor")
@ApiBearerAuth()
@Controller()
export class TutorController {
  constructor(private readonly service: TutorService) {}

  /** Tutor calls are LLM-expensive — strict per-student quota. */
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("tutor/messages")
  @ApiOperation({ summary: "Send a message to the AI tutor" })
  message(@CurrentUser() user: JwtClaims, @Body() dto: TutorMessageDto) {
    return this.service.sendMessage(user.sub, dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("tutor/messages/stream")
  @ApiOperation({ summary: "Stream a tutor reply over Server-Sent Events" })
  stream(@CurrentUser() user: JwtClaims, @Body() dto: TutorMessageDto, @Res() res: Response) {
    return this.service.streamMessage(user.sub, dto, res);
  }

  @Get("tutor/conversations")
  @ApiOperation({ summary: "List recent conversations for the current student" })
  listConversations(@CurrentUser() user: JwtClaims) {
    return this.service.listConversations(user.sub);
  }

  @Get("tutor/conversations/:id")
  @ApiOperation({ summary: "Load a conversation by id" })
  getConversation(@CurrentUser() user: JwtClaims, @Param("id") id: string) {
    return this.service.getConversation(user.sub, id);
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
