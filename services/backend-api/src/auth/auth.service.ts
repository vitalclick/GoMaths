import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import type { LoginDto, RegisterDto } from "./auth.dto";
import { UsersService, type PublicUser } from "./users.service";

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: PublicUser;
}

interface RefreshRecord {
  userId: string;
  hash: string;
  expiresAt: number; // epoch ms
  revoked: boolean;
}

/**
 * Phase 0+ auth implementation.
 *
 * Self-hosted JWT with bcrypt password hashing and refresh-token rotation.
 * Refresh tokens are stored hashed; only the plaintext is returned to the
 * client (once), and the next refresh rotates to a new pair, invalidating
 * the old one. Reuse of a revoked refresh token revokes all sessions for
 * that user (compromise detection).
 *
 * Auth0 alternative path (Phase 1): swap this service's implementation
 * behind the same interface, gated by an env switch:
 *   AUTH_PROVIDER=self_hosted (default) | auth0
 * The controller and guard stay unchanged.
 */
@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshTtlMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly accessTtlSeconds = 15 * 60;
  private readonly refreshStore = new Map<string, RefreshRecord>();

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.refreshSecret = config.get<string>("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me");
  }

  async register(dto: RegisterDto): Promise<AuthSession> {
    const user = await this.users.createStudent(dto);
    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.users.verifyCredentials(dto.email, dto.password);
    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    let payload: { sub: string; jti: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const record = this.refreshStore.get(payload.jti);
    if (!record || record.userId !== payload.sub) {
      throw new UnauthorizedException("Unknown refresh token");
    }
    if (record.revoked) {
      // Reuse detection — revoke every session this user has.
      for (const r of this.refreshStore.values()) {
        if (r.userId === record.userId) r.revoked = true;
      }
      throw new UnauthorizedException("Refresh token already used");
    }
    if (Date.now() > record.expiresAt) {
      throw new UnauthorizedException("Refresh token expired");
    }
    if (!(await bcrypt.compare(refreshToken, record.hash))) {
      throw new UnauthorizedException("Refresh token mismatch");
    }

    // Rotate.
    record.revoked = true;
    const user = this.users.getById(record.userId);
    if (!user) throw new UnauthorizedException("User no longer exists");
    return this.issueSession(user);
  }

  private async issueSession(user: PublicUser): Promise<AuthSession> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role, email: user.email },
      { expiresIn: this.accessTtlSeconds },
    );

    const jti = randomBytes(16).toString("hex");
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti, type: "refresh" },
      { secret: this.refreshSecret, expiresIn: "30d" },
    );

    this.refreshStore.set(jti, {
      userId: user.id,
      hash: await bcrypt.hash(refreshToken, 12),
      expiresAt: Date.now() + this.refreshTtlMs,
      revoked: false,
    });

    const expiresAt = new Date(Date.now() + this.accessTtlSeconds * 1000).toISOString();
    return { accessToken, refreshToken, expiresAt, user };
  }

  /** Test helper. */
  _reset(): void {
    this.refreshStore.clear();
  }
}
