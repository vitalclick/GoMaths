import { NotificationsService } from "./notifications.service";
import type { PrismaService } from "../prisma/prisma.service";

const VALID_TOKEN = "ExponentPushToken[abcDEF123]";

function makeService(): NotificationsService {
  const prismaStub = { enabled: false } as unknown as PrismaService;
  return new NotificationsService(prismaStub);
}

describe("NotificationsService (in-memory)", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("registers a token and sends to it via the Expo Push API", async () => {
    const svc = makeService();
    await svc.register("user-1", {
      token: VALID_TOKEN,
      platform: "ios",
      appSlug: "student",
    });

    const calls: { url: string; body: unknown }[] = [];
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(init.body as string) });
      return new Response(JSON.stringify({ data: [{ status: "ok", id: "tk_1" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const result = await svc.send({
      userId: "user-1",
      title: "Maya says hi",
      body: "Time for your daily streak!",
      data: { kind: "streak" },
    });

    expect(result).toEqual({ delivered: 1, failed: 0 });
    expect(calls).toHaveLength(1);
    const body = calls[0].body as { to: string; title: string; body: string }[];
    expect(body[0].to).toBe(VALID_TOKEN);
    expect(body[0].title).toBe("Maya says hi");
  });

  it("auto-revokes tokens Expo reports as DeviceNotRegistered", async () => {
    const svc = makeService();
    await svc.register("user-1", {
      token: VALID_TOKEN,
      platform: "android",
      appSlug: "student",
    });

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          data: [{ status: "error", details: { error: "DeviceNotRegistered" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )) as unknown as typeof fetch;

    await svc.send({ userId: "user-1", title: "x", body: "y" });

    // Send again — token should be gone, no fetch should be issued.
    let secondCalled = false;
    globalThis.fetch = (async () => {
      secondCalled = true;
      return new Response("[]", { status: 200 });
    }) as unknown as typeof fetch;
    const r = await svc.send({ userId: "user-1", title: "x", body: "y" });
    expect(secondCalled).toBe(false);
    expect(r).toEqual({ delivered: 0, failed: 0 });
  });

  it("filters by appSlug when sending", async () => {
    const svc = makeService();
    await svc.register("user-1", {
      token: "ExponentPushToken[student-device]",
      platform: "ios",
      appSlug: "student",
    });
    await svc.register("user-1", {
      token: "ExponentPushToken[parent-device]",
      platform: "ios",
      appSlug: "parent",
    });

    const sent: string[] = [];
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      const batch = JSON.parse(init.body as string) as { to: string }[];
      for (const m of batch) sent.push(m.to);
      return new Response(
        JSON.stringify({ data: batch.map(() => ({ status: "ok" })) }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    await svc.send({ userId: "user-1", title: "x", body: "y", appSlug: "parent" });

    expect(sent).toEqual(["ExponentPushToken[parent-device]"]);
  });
});
