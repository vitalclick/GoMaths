import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ExpoPushClient, type ExpoPushMessage } from "./expo-push.client";
import type { RegisterPushTokenDto } from "./notifications.dto";

export interface SendNotificationInput {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Restrict to a specific app slug. Omit to send to all the user's devices. */
  appSlug?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly client = new ExpoPushClient();

  // In-memory fallback (Prisma-less mode) — by-user → tokens.
  private readonly fallback = new Map<string, Map<string, StoredToken>>();

  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, dto: RegisterPushTokenDto): Promise<void> {
    const platform = dto.platform.toUpperCase() as "IOS" | "ANDROID" | "WEB";

    if (this.prisma.enabled) {
      await this.prisma.pushToken.upsert({
        where: { token: dto.token },
        create: {
          userId,
          token: dto.token,
          platform,
          appSlug: dto.appSlug,
          deviceName: dto.deviceName ?? null,
        },
        update: {
          userId,
          platform,
          appSlug: dto.appSlug,
          deviceName: dto.deviceName ?? null,
          lastSeenAt: new Date(),
          revokedAt: null,
        },
      });
      return;
    }

    const mine = this.fallback.get(userId) ?? new Map<string, StoredToken>();
    mine.set(dto.token, {
      token: dto.token,
      platform,
      appSlug: dto.appSlug,
      deviceName: dto.deviceName,
    });
    this.fallback.set(userId, mine);
  }

  async revoke(token: string): Promise<void> {
    if (this.prisma.enabled) {
      await this.prisma.pushToken.updateMany({
        where: { token },
        data: { revokedAt: new Date() },
      });
      return;
    }
    for (const map of this.fallback.values()) map.delete(token);
  }

  async send(input: SendNotificationInput): Promise<{ delivered: number; failed: number }> {
    const tokens = await this.tokensFor(input.userId, input.appSlug);
    if (tokens.length === 0) return { delivered: 0, failed: 0 };

    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t,
      title: input.title,
      body: input.body,
      data: input.data,
      sound: "default",
      channelId: "default",
    }));

    try {
      const tickets = await this.client.send(messages);
      let delivered = 0;
      let failed = 0;
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === "ok") {
          delivered++;
        } else {
          failed++;
          // Auto-revoke tokens Expo flags as unregistered so we stop
          // wasting calls on them.
          if (ticket.details?.error === "DeviceNotRegistered") {
            await this.revoke(tokens[i]);
          }
        }
      }
      return { delivered, failed };
    } catch (err) {
      this.logger.warn(`Push send failed: ${(err as Error).message}`);
      return { delivered: 0, failed: tokens.length };
    }
  }

  private async tokensFor(userId: string, appSlug?: string): Promise<string[]> {
    if (this.prisma.enabled) {
      const rows = await this.prisma.pushToken.findMany({
        where: {
          userId,
          revokedAt: null,
          ...(appSlug ? { appSlug } : {}),
        },
        select: { token: true },
      });
      return rows.map((r: { token: string }) => r.token);
    }
    const mine = this.fallback.get(userId);
    if (!mine) return [];
    return [...mine.values()].filter((t) => !appSlug || t.appSlug === appSlug).map((t) => t.token);
  }
}

interface StoredToken {
  token: string;
  platform: "IOS" | "ANDROID" | "WEB";
  appSlug: string;
  deviceName?: string;
}
