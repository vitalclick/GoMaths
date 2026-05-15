import { ConfigService } from "@nestjs/config";
import type Redis from "ioredis";
import { LeaderService } from "./leader.service";

interface FakeRedis {
  values: Map<string, string>;
  ttls: Map<string, number>;
  set: jest.Mock;
  get: jest.Mock;
  eval: jest.Mock;
  del: jest.Mock;
  on: jest.Mock;
}

function fakeRedis(): FakeRedis {
  const values = new Map<string, string>();
  const ttls = new Map<string, number>();

  const set = jest.fn(async (key: string, value: string, ..._args: unknown[]) => {
    // Honour NX semantics: do not overwrite.
    if (values.has(key)) return null;
    values.set(key, value);
    return "OK";
  });

  const get = jest.fn(async (key: string) => values.get(key) ?? null);

  // Tiny interpreter for the two Lua scripts the service runs.
  const evalFn = jest.fn(
    async (script: string, _numkeys: number, key: string, expected: string, ttlMs?: string) => {
      if (values.get(key) !== expected) return 0;
      if (script.includes("pexpire")) {
        ttls.set(key, Number(ttlMs ?? "0"));
        return 1;
      }
      if (script.includes("del")) {
        values.delete(key);
        ttls.delete(key);
        return 1;
      }
      return 0;
    },
  );

  const del = jest.fn(async (key: string) => {
    const had = values.delete(key);
    ttls.delete(key);
    return had ? 1 : 0;
  });

  return {
    values,
    ttls,
    set,
    get,
    eval: evalFn,
    del,
    on: jest.fn(),
  };
}

function makeLeader(redis: FakeRedis): LeaderService {
  const config = {
    get: (k: string, fallback?: string) => (k === "REDIS_URL" ? "redis://injected" : fallback),
  } as unknown as ConfigService;
  return new LeaderService(config, redis as unknown as Redis);
}

describe("LeaderService", () => {
  it("releases the lock with a CAS-on-value Lua script (not a blind DEL)", async () => {
    const r = fakeRedis();
    const leader = makeLeader(r);
    await leader.runIfLeader("test", 1000, async () => {});
    // releaseIfOwner uses eval, never redis.del directly.
    expect(r.del).not.toHaveBeenCalled();
    expect(r.eval).toHaveBeenCalled();
    // The key is gone after release.
    expect(r.values.has("gomaths:lock:test")).toBe(false);
  });

  it("renews the lock periodically while work runs", async () => {
    jest.useFakeTimers();
    const r = fakeRedis();
    const leader = makeLeader(r);

    const work = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          // Resolve after several renewal intervals' worth of fake time.
          setTimeout(() => resolve(), 5_000);
        }),
    );

    const promise = leader.runIfLeader("long", 3_000, work, { renewIntervalMs: 1_000 });

    // Advance through three renewal intervals.
    await jest.advanceTimersByTimeAsync(1_000);
    await jest.advanceTimersByTimeAsync(1_000);
    await jest.advanceTimersByTimeAsync(1_000);
    await jest.advanceTimersByTimeAsync(2_000); // resolve work

    await promise;

    const renewalCalls = r.eval.mock.calls.filter(([script]) => String(script).includes("pexpire"));
    expect(renewalCalls.length).toBeGreaterThanOrEqual(2);

    jest.useRealTimers();
  });

  it("returns false when another pod holds the lock", async () => {
    const r = fakeRedis();
    r.values.set("gomaths:lock:taken", "other-pod");
    const leader = makeLeader(r);

    const work = jest.fn();
    const ran = await leader.runIfLeader("taken", 1_000, work);
    expect(ran).toBe(false);
    expect(work).not.toHaveBeenCalled();
  });

  it("never DELs a lock another pod has stolen", async () => {
    const r = fakeRedis();
    const leader = makeLeader(r);

    await leader.runIfLeader("stolen", 1_000, async () => {
      // Mid-work the lock value is overwritten by a peer who acquired it
      // legitimately (e.g. after our lock expired). The release path's
      // Lua CAS must see the mismatch and refuse to delete.
      r.values.set("gomaths:lock:stolen", "another-pod");
    });

    expect(r.values.get("gomaths:lock:stolen")).toBe("another-pod");
  });
});
