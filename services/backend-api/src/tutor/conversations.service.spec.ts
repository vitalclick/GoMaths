import { NotFoundException } from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import type { PrismaService } from "../prisma/prisma.service";

function makeService(): ConversationsService {
  // In-memory mode: a PrismaService stub with enabled=false is enough.
  const prismaStub = { enabled: false } as unknown as PrismaService;
  return new ConversationsService(prismaStub);
}

describe("ConversationsService (in-memory)", () => {
  it("creates a conversation and lists it back for the owner", async () => {
    const svc = makeService();
    const c = await svc.create("s1", "g9.alg.linear-eq");
    const list = await svc.list("s1");
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(c.id);
    expect(list[0].topicId).toBe("g9.alg.linear-eq");
  });

  it("hides a conversation from another student even when the id is known", async () => {
    const svc = makeService();
    const c = await svc.create("s1");
    await expect(svc.get("intruder", c.id)).rejects.toThrow(NotFoundException);
    expect(await svc.list("intruder")).toHaveLength(0);
  });

  it("appends turns and computes history with the most recent window", async () => {
    const svc = makeService();
    const c = await svc.create("s1");
    for (let i = 0; i < 25; i++) {
      const role = i % 2 === 0 ? "user" : "maya";
      await svc.appendTurn("s1", c.id, {
        role,
        text: `msg ${i}`,
        occurredAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
      });
    }
    const recent = await svc.recentTurns("s1", c.id);
    expect(recent).toHaveLength(ConversationsService.HISTORY_LIMIT);
    expect(recent[recent.length - 1].text).toBe("msg 24");
  });

  it("rejects appendTurn to a conversation owned by someone else", async () => {
    const svc = makeService();
    const c = await svc.create("s1");
    await expect(
      svc.appendTurn("intruder", c.id, {
        role: "user",
        text: "i shouldn't be here",
        occurredAt: new Date().toISOString(),
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
