import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type JwtClaims } from "../auth/auth.guard";
import { RecordActivityDto, StatsViewDto } from "./gamification.dto";
import { GamificationService } from "./gamification.service";

@ApiTags("gamification")
@ApiBearerAuth()
@Controller("gamification")
export class GamificationController {
  constructor(private readonly service: GamificationService) {}

  @Get("me")
  @ApiOperation({ summary: "XP, level, streak and daily-goal for the current learner" })
  me(@CurrentUser() user: JwtClaims): Promise<StatsViewDto> {
    return this.service.getStats(user.sub);
  }

  @Post("me/activity")
  @ApiOperation({
    summary: "Record a learner activity (awards XP, advances streak/daily goal)",
  })
  record(@CurrentUser() user: JwtClaims, @Body() dto: RecordActivityDto): Promise<StatsViewDto> {
    return this.service.recordActivity(user.sub, dto.kind);
  }
}
