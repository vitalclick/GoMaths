import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProgressService } from "./progress.service";
import { ProgressEventInputDto } from "./progress.dto";
import { CurrentUser, type JwtClaims } from "../auth/auth.guard";

@ApiTags("progress")
@ApiBearerAuth()
@Controller("progress")
export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  @Post("events")
  @HttpCode(202)
  @ApiOperation({ summary: "Record a learner event" })
  record(@CurrentUser() user: JwtClaims, @Body() input: ProgressEventInputDto) {
    return this.service.record(user.sub, input);
  }

  @Get("summary")
  @ApiOperation({ summary: "Per-topic mastery summary for the current student" })
  summary(@CurrentUser() user: JwtClaims) {
    return this.service.summary(user.sub);
  }
}
