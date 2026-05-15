import { ConfigService } from "@nestjs/config";
import { Readable } from "node:stream";
import type { Response } from "express";
import { TutorService } from "./tutor.service";
import { ConversationsService } from "./conversations.service";
import type { CurriculumService } from "../curriculum/curriculum.service";
import type { PrismaService } from "../prisma/prisma.service";

const STUDENT_ID = "student-x";

function makeService(): TutorService {
  const prismaStub = { enabled: false } as unknown as PrismaService;
  const conversations = new ConversationsService(prismaStub);
  const config = {
    get: (_k: string, fallback: string) => fallback,
  } as unknown as ConfigService;
  // CurriculumService isn't exercised in these tests — stub the only
  // method TutorService calls into.
  const curriculum = { getQuestion: () => undefined } as unknown as CurriculumService;
  return new TutorService(config, curriculum, conversations);
}

/**
 * Build a fake Express Response that captures written SSE frames into
 * an array. Mirrors the surface area the production proxy uses.
 */
function makeResponse() {
  const chunks: string[] = [];
  const headers: Record<string, string> = {};
  let ended = false;
  const res = {
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
    flushHeaders: () => {},
    write: (chunk: string) => {
      chunks.push(chunk);
      return true;
    },
    end: () => {
      ended = true;
    },
  } as unknown as Response;
  return { res, chunks, headers, ended: () => ended };
}

/** Produce a streaming body matching what ai-services/tutor /chat/stream would emit. */
function fakeUpstreamBody(events: string[]): Response {
  const stream = new Readable({
    read() {
      for (const e of events) this.push(e);
      this.push(null);
    },
  });
  return {
    ok: true,
    status: 200,
    body: Readable.toWeb(stream) as unknown as ReadableStream,
  } as unknown as Response;
}

describe("TutorService.streamMessage", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("forwards delta, claim, and done frames verbatim and emits a meta frame first", async () => {
    const svc = makeService();
    const { res, chunks, ended } = makeResponse();

    globalThis.fetch = (async () =>
      fakeUpstreamBody([
        `event: delta\ndata: ${JSON.stringify({ text: "Hello " })}\n\n`,
        `event: delta\ndata: ${JSON.stringify({ text: "world" })}\n\n`,
        `event: claim\ndata: ${JSON.stringify({ raw: "x = 4", stem: "x", answer: "4", ok: true })}\n\n`,
        `event: done\ndata: ${JSON.stringify({ reply: "Hello world", validated: true })}\n\n`,
      ])) as unknown as typeof fetch;

    await svc.streamMessage(STUDENT_ID, { message: "Hi" }, res);

    expect(ended()).toBe(true);
    // First frame is the meta event carrying the persisted conversationId.
    expect(chunks[0]).toMatch(/^event: meta\ndata: \{"conversationId":"conv_/);
    // Subsequent frames are passed through.
    const joined = chunks.join("");
    expect(joined).toContain('event: delta\ndata: {"text":"Hello "}');
    expect(joined).toContain('event: claim\ndata: {"raw":"x = 4"');
    expect(joined).toContain('event: done\ndata: {"reply":"Hello world","validated":true}');
  });

  it("persists Maya's turn into the conversation once `done` arrives", async () => {
    const svc = makeService();
    const { res } = makeResponse();
    globalThis.fetch = (async () =>
      fakeUpstreamBody([
        `event: delta\ndata: ${JSON.stringify({ text: "Reply" })}\n\n`,
        `event: done\ndata: ${JSON.stringify({ reply: "Reply", validated: false })}\n\n`,
      ])) as unknown as typeof fetch;

    await svc.streamMessage(STUDENT_ID, { message: "Hi" }, res);

    const list = await svc.listConversations(STUDENT_ID);
    expect(list).toHaveLength(1);
    expect(list[0].turnCount).toBe(2); // user + maya

    const conv = await svc.getConversation(STUDENT_ID, list[0].id);
    expect(conv.turns[0]).toMatchObject({ role: "user", text: "Hi" });
    expect(conv.turns[1]).toMatchObject({ role: "maya", text: "Reply", validated: false });
  });

  it("falls back to an offline message and persists it when upstream throws", async () => {
    const svc = makeService();
    const { res, chunks } = makeResponse();
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;

    await svc.streamMessage(STUDENT_ID, { message: "Hello" }, res);

    const joined = chunks.join("");
    expect(joined).toContain("event: delta");
    expect(joined).toContain("event: done");
    expect(joined).toContain("tutor service offline");

    const list = await svc.listConversations(STUDENT_ID);
    const conv = await svc.getConversation(STUDENT_ID, list[0].id);
    expect(conv.turns).toHaveLength(2);
    expect(conv.turns[1].validated).toBe(false);
  });
});
