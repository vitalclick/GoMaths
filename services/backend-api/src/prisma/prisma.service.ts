import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Wraps PrismaClient as a Nest provider. When `DATABASE_URL` is unset we
 * skip the real connection — services that depend on this check `enabled`
 * and fall back to their in-memory implementation. That keeps the demo
 * runnable on a laptop without spinning up Postgres.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly enabled: boolean;

  constructor() {
    super({ log: ["warn", "error"] });
    this.enabled = Boolean(process.env.DATABASE_URL);
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.warn("DATABASE_URL not set — Prisma disabled, services will use in-memory stores");
      return;
    }
    try {
      await this.$connect();
      this.logger.log("Prisma connected");
    } catch (err) {
      this.logger.error(`Prisma failed to connect: ${(err as Error).message}`);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.enabled) await this.$disconnect();
  }
}
