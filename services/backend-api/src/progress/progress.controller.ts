import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProgressService } from "./progress.service";
import { ProgressEventInputDto } from "./progress.dto";

/**
 * Phase 0: there is no authenticated user yet (auth blocked on ADR-005),
 * so every request uses a fixed `demo-student` id. Phase 1 swaps this for
 * the authenticated student id from the JWT.
 */
const DEMO_STUDENT_ID = "demo-student";

@ApiTags("progress")
@Controller("progress")
export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  @Post("events")
  @HttpCode(202)
  @ApiOperation({ summary: "Record a learner event" })
  record(@Body() input: ProgressEventInputDto) {
    return this.service.record(DEMO_STUDENT_ID, input);
  }

  @Get("summary")
  @ApiOperation({ summary: "Per-topic mastery summary for the current student" })
  summary() {
    return this.service.summary(DEMO_STUDENT_ID);
  }
}
