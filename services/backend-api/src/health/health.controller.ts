import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import Redis from "ioredis";
import { Public } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

type DepState = "ok" | "down" | "skipped";

interface DepCheck {
  name: string;
  state: DepState;
  detail?: string;
  /** When true, a `down` result fails overall readiness. */
  required: boolean;
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Liveness probe" })
  health() {
    return { status: "ok", service: "backend-api", time: new Date().toISOString() };
  }

  @Public()
  @Get("ready")
  @ApiOperation({
    summary: "Readiness probe — verifies connectivity to every configured dependency",
  })
  async ready() {
    const checks = await Promise.all([
      this.checkDb(),
      this.checkRedis(),
      ...this.checkAiServices(),
    ]);

    const ready = checks.every((c) => c.state !== "down" || !c.required);
    const body = {
      status: ready ? "ready" : "not-ready",
      service: "backend-api",
      time: new Date().toISOString(),
      dependencies: checks,
    };

    if (!ready) throw new ServiceUnavailableException(body);
    return body;
  }

  private async checkDb(): Promise<DepCheck> {
    if (!this.prisma.enabled) {
      return {
        name: "postgres",
        state: "skipped",
        required: false,
        detail: "DATABASE_URL unset — using in-memory stores",
      };
    }
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { name: "postgres", state: "ok", required: true };
    } catch (err) {
      return { name: "postgres", state: "down", required: true, detail: (err as Error).message };
    }
  }

  private async checkRedis(): Promise<DepCheck> {
    const url = this.config.get<string>("REDIS_URL");
    if (!url) {
      return {
        name: "redis",
        state: "skipped",
        required: false,
        detail: "REDIS_URL unset — per-pod throttling, scheduler on every pod",
      };
    }
    const client = new Redis(url, {
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    try {
      await client.connect();
      await client.ping();
      return { name: "redis", state: "ok", required: true };
    } catch (err) {
      return { name: "redis", state: "down", required: true, detail: (err as Error).message };
    } finally {
      client.disconnect();
    }
  }

  private checkAiServices(): Promise<DepCheck>[] {
    const services: Array<{ name: string; key: string; fallback: string }> = [
      { name: "tutor", key: "TUTOR_SERVICE_URL", fallback: "http://localhost:8001" },
      { name: "solver", key: "SOLVER_SERVICE_URL", fallback: "http://localhost:8002" },
      { name: "validation", key: "VALIDATION_SERVICE_URL", fallback: "http://localhost:8003" },
    ];
    return services.map(async ({ name, key, fallback }) => {
      const base = this.config.get<string>(key) ?? fallback;
      try {
        const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(2000) });
        if (!res.ok) {
          return { name, state: "down" as const, required: true, detail: `HTTP ${res.status}` };
        }
        return { name, state: "ok" as const, required: true, detail: base };
      } catch (err) {
        return { name, state: "down" as const, required: true, detail: (err as Error).message };
      }
    });
  }
}
