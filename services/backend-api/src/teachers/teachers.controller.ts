import { Controller, Get, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type JwtClaims } from "../auth/auth.guard";
import { TeachersService } from "./teachers.service";

@ApiTags("teachers")
@ApiBearerAuth()
@Controller("teachers")
export class TeachersController {
  constructor(private readonly service: TeachersService) {}

  @Get("me/classes")
  @ApiOperation({ summary: "Classes the current teacher teaches" })
  classes(@CurrentUser() user: JwtClaims) {
    return this.service.listClasses(user.sub);
  }

  @Get("me/classes/:classId/roster")
  @ApiOperation({ summary: "Students enrolled in one of the teacher's classes" })
  roster(@CurrentUser() user: JwtClaims, @Param("classId") classId: string) {
    return this.service.getRoster(user.sub, classId);
  }
}
