import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import type { Request } from "express";
import type { JwtClaims } from "../auth/auth.guard";

/**
 * Global rate limiting.
 *
 * Two named throttlers:
 *   - "default": 120 req/min per identity — applies to every route
 *     unless explicitly skipped.
 *   - "tutor":   20 req/min per identity — wired on the tutor + solver
 *     endpoints via @Throttle({ tutor: { limit, ttl } }) on the
 *     controller methods.
 *
 * Identity = JWT.sub when present (so a single learner can't multi-
 * session their way around the limit), or the source IP when not (the
 * register/login endpoints).
 *
 * Phase 1: swap the in-process LRU store for Redis via
 * `@nest-lab/throttler-storage-redis` so the limit applies across
 * the multi-pod backend deployment, not just per-pod.
 */
@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 120 },
      { name: "tutor", ttl: 60_000, limit: 20 },
    ]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: IdentityThrottlerGuard },
  ],
})
export class ThrottlingModule {}

class IdentityThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const r = req as Request & { user?: JwtClaims };
    if (r.user?.sub) return `u:${r.user.sub}`;
    const ip = (r.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() || r.ip;
    return `ip:${ip ?? "unknown"}`;
  }
}
