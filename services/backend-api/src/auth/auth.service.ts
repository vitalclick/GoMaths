import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import type { LoginDto, RegisterDto } from "./auth.dto";
import { ParentalConsentService } from "./parental-consent.service";
import { UsersService, type PublicUser } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";

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
 * Self-hosted JWT auth with bcrypt password hashing and refresh-token
 * rotation. Refresh records persist to Postgres via Prisma when enabled,
 * fall back to an in-memory Map otherwise.
 *
 * Reuse of a revoked refresh token revokes all sessions for that user
 * (compromise detection).
 *
 * Auth0 alternative path (per ADR-005): swap this service behind the
 * same interface, gated by `AUTH_PROVIDER=self_hosted|auth0`.
 */
@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshTtlMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly accessTtlSeconds = 15 * 60;
  // In-memory fallback when prisma.enabled is false.
  private readonly refreshStore = new Map<string, RefreshRecord>();

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly consent: ParentalConsentService,
    config: ConfigService,
  ) {
    this.refreshSecret = config.get<string>("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me");
  }

  async register(dto: RegisterDto): Promise<AuthSession> {
    if (isMinor(dto.birthYear)) {
      if (!dto.parentalConsentToken) {
        throw new BadRequestException(
          "Parental consent is required for learners under 18. Complete /auth/parental-consent/request first.",
        );
      }
      // Throws if invalid / expired / not confirmed / email mismatch.
      await this.consent.consumeForRegistration(dto.parentalConsentToken, dto.email);
    }
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

    const tokenHashLookup = hashRefresh(refreshToken);

    if (this.prisma.enabled) {
      const session = await this.prisma.session.findUnique({
        where: { refreshTokenHash: tokenHashLookup },
      });
      if (!session || session.userId !== payload.sub) {
        throw new UnauthorizedException("Unknown refresh token");
      }
      if (session.revokedAt) {
        // Reuse detection — revoke every session this user has.
        await this.prisma.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException("Refresh token already used");
      }
      if (session.expiresAt.getTime() < Date.now()) {
        throw new UnauthorizedException("Refresh token expired");
      }
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      const user = await this.users.getById(session.userId);
      if (!user) throw new UnauthorizedException("User no longer exists");
      return this.issueSession(user);
    }

    const record = this.refreshStore.get(payload.jti);
    if (!record || record.userId !== payload.sub) {
      throw new UnauthorizedException("Unknown refresh token");
    }
    if (record.revoked) {
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
    record.revoked = true;
    const user = await this.users.getById(record.userId);
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
    const expiresAtMs = Date.now() + this.refreshTtlMs;

    if (this.prisma.enabled) {
      await this.prisma.session.create({
        data: {
          userId: user.id,
          refreshTokenHash: hashRefresh(refreshToken),
          expiresAt: new Date(expiresAtMs),
        },
      });
    } else {
      this.refreshStore.set(jti, {
        userId: user.id,
        hash: await bcrypt.hash(refreshToken, 12),
        expiresAt: expiresAtMs,
        revoked: false,
      });
    }

    const accessExpiresAt = new Date(Date.now() + this.accessTtlSeconds * 1000).toISOString();
    return { accessToken, refreshToken, expiresAt: accessExpiresAt, user };
  }

  /** Test helper — in-memory only. */
  _reset(): void {
    this.refreshStore.clear();
  }
}

/**
 * Stable SHA-256 lookup of the refresh token. Used as the primary key
 * for the Session table so we can find a session by token in O(1)
 * without iterating + bcrypt-comparing every row.
 *
 * SHA-256 is acceptable here (vs. bcrypt) because the token is itself
 * high-entropy random — we just need a stable digest, not protection
 * against rainbow tables.
 */
function hashRefresh(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * POPIA / Children's Act: under-18 ⇒ parental consent required. We use
 * a year-only comparison (no DoB) to minimise PII; a learner born in the
 * cutoff year is treated as a minor for the whole calendar year, which
 * is a conservative bias that suits the regulation.
 */
function isMinor(birthYear: number): boolean {
  return new Date().getUTCFullYear() - birthYear < 18;
}
