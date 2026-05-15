import { Module, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import Redis from "ioredis";
import type { Request } from "express";
import type { JwtClaims } from "../auth/auth.guard";

/**
 * Global rate limiting.
 *
 * Two named throttlers (configured per-route via @Throttle):
 *   - default : 120 req/min per identity — applied to most routes
 *   - tutor   : 20 req/min on tutor and tutor-stream endpoints (LLM cost)
 *               and 30 req/min on solver/scan (OCR cost)
 *
 * Identity = JWT.sub when present, else IP. So a learner can't bypass
 * the limit by signing in twice.
 *
 * Storage:
 *   - Redis when REDIS_URL is set (production / staging) — quota is
 *     shared across pods.
 *   - In-process otherwise (local dev / demos) — quota is per pod,
 *     which is fine when there's only one.
 */
class IdentityThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const r = req as unknown as Request & { user?: JwtClaims };
    if (r.user?.sub) return `u:${r.user.sub}`;
    const ip = (r.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() || r.ip;
    return `ip:${ip ?? "unknown"}`;
  }
}

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("REDIS_URL");
        const log = new Logger("Throttler");
        const baseThrottlers = [
          { name: "default", ttl: 60_000, limit: 120 },
          { name: "tutor", ttl: 60_000, limit: 20 },
        ];

        if (!url) {
          log.warn("REDIS_URL not set — using in-process throttler storage (per-pod quotas)");
          return { throttlers: baseThrottlers };
        }
        log.log(`Throttler using Redis at ${redacted(url)}`);
        return {
          throttlers: baseThrottlers,
          storage: new ThrottlerStorageRedisService(new Redis(url)),
        };
      },
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: IdentityThrottlerGuard }],
})
export class ThrottlingModule {}

/** Redact the password from a Redis URL for safe logging. */
function redacted(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "<invalid>";
  }
}
