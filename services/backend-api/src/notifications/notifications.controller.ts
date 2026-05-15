import { Body, Controller, Delete, HttpCode, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { RegisterPushTokenDto } from "./notifications.dto";
import { CurrentUser, type JwtClaims } from "../auth/auth.guard";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post("tokens")
  @HttpCode(204)
  @ApiOperation({ summary: "Register or refresh an Expo push token for the current user" })
  async register(@CurrentUser() user: JwtClaims, @Body() dto: RegisterPushTokenDto) {
    await this.service.register(user.sub, dto);
  }

  @Delete("tokens/:token")
  @HttpCode(204)
  @ApiOperation({ summary: "Revoke a previously registered push token" })
  async revoke(@Param("token") token: string) {
    await this.service.revoke(token);
  }
}
