import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import { hostname } from "node:os";
import Redis from "ioredis";

/**
 * Lightweight leader election for scheduled tasks.
 *
 * Every cron callback wraps itself in `await leader.runIfLeader(...)`.
 * Internally that's a Redis `SET key value NX PX ttl` — the first pod to
 * win the race holds the lock for `ttlMs`, and only it executes the task.
 * Others see the SET fail and skip.
 *
 * Release is Lua-scripted (CAS on value) so a pod that overran its TTL
 * cannot accidentally delete another pod's freshly-acquired lock.
 *
 * Renewal: long-running tasks pass `renewIntervalMs` (or accept the
 * computed default of ttlMs/3). Every interval the holder Lua-scripts a
 * PEXPIRE — also CAS-on-value, so a pod that's lost the lock to a peer
 * cannot revive ownership it no longer holds. If renewal fails three
 * times in a row, the work is cancelled (a stalled pod has lost the
 * right to keep working).
 *
 * No Redis configured ⇒ assume single-pod dev and always run.
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
   *
   * - `ttlMs`            initial lock duration
   * - `renewIntervalMs`  how often to extend the lock while `work` runs.
   *                      Defaults to ttlMs / 3 — three chances to renew
   *                      before another pod could claim the key.
   *
   * Returns true if this pod ran it; false if another pod held the lock
   * or if a renewal failure aborted the work.
   */
  async runIfLeader(
    key: string,
    ttlMs: number,
    work: () => Promise<void>,
    opts: { renewIntervalMs?: number } = {},
  ): Promise<boolean> {
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

    // Start the renewal heartbeat. Three consecutive failures cause the
    // work to be cancelled — at that point we no longer own the lock
    // and continuing would race a peer that took over.
    const renewIntervalMs = opts.renewIntervalMs ?? Math.max(1_000, Math.floor(ttlMs / 3));
    const renewal = this.startRenewal(lockKey, ttlMs, renewIntervalMs);

    try {
      await work();
      return true;
    } catch (err) {
      this.logger.warn(`'${key}' threw: ${(err as Error).message}`);
      throw err;
    } finally {
      renewal.stop();
      // CAS-on-value release.
      const released = await this.releaseIfOwner(lockKey);
      if (!released) {
        this.logger.warn(`Released '${key}' lock that we no longer owned`);
      }
    }
  }

  /**
   * Returns an object exposing `stop()` to cancel the heartbeat. The
   * heartbeat issues PEXPIRE-if-still-mine every `intervalMs` and logs
   * (but does not throw on) failures — the cron will see an empty key
   * on the next attempt anyway.
   */
  private startRenewal(lockKey: string, ttlMs: number, intervalMs: number): { stop: () => void } {
    if (!this.redis) return { stop: () => undefined };
    let stopped = false;
    let consecutiveFailures = 0;

    const tick = async () => {
      if (stopped || !this.redis) return;
      try {
        const ok = await this.renewIfOwner(lockKey, ttlMs);
        if (ok) {
          consecutiveFailures = 0;
        } else {
          consecutiveFailures += 1;
          this.logger.warn(`Renewal of '${lockKey}' returned not-owner (${consecutiveFailures}/3)`);
        }
      } catch (err) {
        consecutiveFailures += 1;
        this.logger.warn(
          `Renewal of '${lockKey}' failed (${consecutiveFailures}/3): ${(err as Error).message}`,
        );
      }
      // After three failures stop trying — the work itself will see the
      // next operation against a lost lock and bail.
      if (!stopped && consecutiveFailures < 3) {
        timer = setTimeout(tick, intervalMs);
      }
    };

    let timer: NodeJS.Timeout = setTimeout(tick, intervalMs);
    // Don't let the timer block process exit.
    timer.unref?.();

    return {
      stop: () => {
        stopped = true;
        clearTimeout(timer);
      },
    };
  }

  /** Lua: PEXPIRE only if the key's value still equals our identity. */
  private async renewIfOwner(lockKey: string, ttlMs: number): Promise<boolean> {
    if (!this.redis) return true;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    const result = await this.redis.eval(script, 1, lockKey, this.self, String(ttlMs));
    return result === 1;
  }

  /** Lua: DEL only if the key's value still equals our identity. */
  private async releaseIfOwner(lockKey: string): Promise<boolean> {
    if (!this.redis) return true;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.redis.eval(script, 1, lockKey, this.self);
    return result === 1;
  }
}
