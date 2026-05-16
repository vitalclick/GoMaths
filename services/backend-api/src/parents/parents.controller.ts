import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, JwtAuthGuard, type JwtClaims } from "../auth/auth.guard";
import { ParentsService } from "./parents.service";

@ApiTags("parents")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("parents")
export class ParentsController {
  constructor(private readonly parents: ParentsService) {}

  @Get("me/children")
  @ApiOperation({ summary: "List children linked to the current parent via consent" })
  listMyChildren(@CurrentUser() claims: JwtClaims) {
    return this.parents.listChildren(claims.email);
  }
}
