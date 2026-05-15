import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshDto, RegisterDto } from "./auth.dto";
import { CurrentUser, JwtAuthGuard, Public, type JwtClaims } from "./auth.guard";
import { UsersService } from "./users.service";

@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post("auth/register")
  @HttpCode(201)
  @ApiOperation({ summary: "Register a new student account" })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post("auth/login")
  @HttpCode(200)
  @ApiOperation({ summary: "Exchange credentials for tokens" })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post("auth/refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Refresh an access token" })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get("users/me")
  @ApiOperation({ summary: "Current user" })
  me(@CurrentUser() claims: JwtClaims) {
    const user = this.users.getById(claims.sub);
    if (!user) throw new Error("User not found"); // should never happen if token is valid
    return user;
  }
}
