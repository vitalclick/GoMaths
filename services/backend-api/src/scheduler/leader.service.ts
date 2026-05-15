import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { hostname, randomBytes } from "node:crypto";
import Redis from "ioredis";

/**
 * Lightweight leader election for scheduled tasks.
 *
 * Every cron callback wraps itself in `await leader.runIfLeader(name, ...)`.
 * Internally that's a Redis `SET key value NX PX ttl` — the first pod to
 * win the race holds the lock for `ttlMs`, and only it executes the task.
 * Others see the SET fail and skip.
 *
 * No Redis configured ⇒ assume single-pod dev and always run. Logs the
 * decision so the operator can confirm which pod actually fired the job.
 *
 * Phase 1 hardening:
 *  - Renew the lock periodically inside long-running tasks so a slow
 *    job (say, batch push to 100k students) doesn't trigger a duplicate
 *    on another pod halfway through.
 *  - Lua-script the release so we only delete the key if we still own it.
 */
@Injectable()
export class LeaderService {
  private readonly logger = new Logger(LeaderService.name);
  private readonly redis: Redis | null;
  /** Stable per-pod identity. Same pod, same value, across multiple runs. */
  private readonly self = `${hostname()}-${randomBytes(4).toString("hex")}`;

  constructor(config: ConfigService, @Optional() @Inject("REDIS_OVERRIDE") redisOverride?: Redis) {
    const url = config.get<string>("REDIS_URL");
    if (redisOverride) {
      this.redis = redisOverride;
    } else if (url) {
      this.redis = new Redis(url);
      this.redis.on("error", (err) => this.logger.warn(`Redis error: ${err.message}`));
    } else {
      this.redis = null;
    }
  }

  /**
   * Run `work` exactly once across the deployment per `key` per `ttlMs`.
   * Returns true if this pod ran it, false if another pod held the lock.
   */
  async runIfLeader(key: string, ttlMs: number, work: () => Promise<void>): Promise<boolean> {
    if (!this.redis) {
      this.logger.log(`No Redis — running '${key}' locally`);
      await work();
      return true;
    }

    const lockKey = `gomaths:lock:${key}`;
    const acquired = await this.redis.set(lockKey, this.self, "PX", ttlMs, "NX");

    if (acquired !== "OK") {
      this.logger.log(`Skipping '${key}' — another pod holds the lock`);
      return false;
    }

    this.logger.log(`Acquired '${key}' for ${ttlMs}ms (holder=${this.self})`);
    try {
      await work();
    } finally {
      // Best-effort release. If `work` outran the TTL another pod has
      // already taken over — we don't want to delete THEIR lock, so
      // we check ownership first.
      const current = await this.redis.get(lockKey);
      if (current === this.self) await this.redis.del(lockKey);
    }
    return true;
  }
}
