import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { CurriculumService } from "../curriculum/curriculum.service";
import { ConversationsService, type Turn } from "./conversations.service";

interface TutorUpstreamResponse {
  reply: string;
  validated: boolean;
}

interface ValidationUpstreamResponse {
  status: "equivalent" | "not_equivalent" | "not_verified";
  detail: string;
  ok: boolean;
}

@Injectable()
export class TutorService {
  private readonly logger = new Logger(TutorService.name);
  private readonly tutorUrl: string;
  private readonly validationUrl: string;

  constructor(
    config: ConfigService,
    private readonly curriculum: CurriculumService,
    private readonly conversations: ConversationsService,
  ) {
    this.tutorUrl = config.get("TUTOR_SERVICE_URL", "http://localhost:8001");
    this.validationUrl = config.get("VALIDATION_SERVICE_URL", "http://localhost:8003");
  }

  async listConversations(studentId: string) {
    const convs = await this.conversations.list(studentId);
    return convs.map(({ id, topicId, createdAt, updatedAt, turns }) => ({
      id,
      topicId,
      createdAt,
      updatedAt,
      preview: turns[turns.length - 1]?.text.slice(0, 80) ?? "",
      turnCount: turns.length,
    }));
  }

  getConversation(studentId: string, conversationId: string) {
    return this.conversations.get(studentId, conversationId);
  }

  async sendMessage(
    studentId: string,
    input: { message: string; topicId?: string; conversationId?: string },
  ) {
    const conv = input.conversationId
      ? await this.conversations.get(studentId, input.conversationId)
      : await this.conversations.create(studentId, input.topicId);

    const userTurn: Turn = {
      role: "user",
      text: input.message,
      occurredAt: new Date().toISOString(),
    };
    await this.conversations.appendTurn(studentId, conv.id, userTurn);

    const recent = await this.conversations.recentTurns(studentId, conv.id);
    const history = recent
      .slice(0, -1) // exclude the just-appended user turn (sent separately as `message`)
      .map((t) => ({ role: t.role === "maya" ? "assistant" : "user", content: t.text }));

    const payload = {
      student_id: studentId,
      message: input.message,
      topic_id: input.topicId ?? conv.topicId,
      history,
    };

    let reply = "";
    let validated = false;
    try {
      const res = await fetch(`${this.tutorUrl}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      const body = (await res.json()) as TutorUpstreamResponse;
      reply = body.reply;
      validated = body.validated;
    } catch (err) {
      this.logger.warn(`tutor upstream unavailable: ${(err as Error).message}`);
      reply =
        "(tutor service offline) Once the AI tutor is running, this would be a real response from Maya. Try again later.";
    }

    const mayaTurn: Turn = {
      role: "maya",
      text: reply,
      occurredAt: new Date().toISOString(),
      validated,
    };
    await this.conversations.appendTurn(studentId, conv.id, mayaTurn);

    return { conversationId: conv.id, reply, validated };
  }

  /**
   * Stream a tutor reply over SSE. Persists the user turn immediately, then
   * tees the SSE stream from ai-services to the client while accumulating
   * the reply locally so we can write the Maya turn when the upstream
   * `done` event arrives. The response is closed after `done` or `error`.
   */
  async streamMessage(
    studentId: string,
    input: { message: string; topicId?: string; conversationId?: string },
    res: Response,
  ): Promise<void> {
    const conv = input.conversationId
      ? await this.conversations.get(studentId, input.conversationId)
      : await this.conversations.create(studentId, input.topicId);

    const userTurn: Turn = {
      role: "user",
      text: input.message,
      occurredAt: new Date().toISOString(),
    };
    await this.conversations.appendTurn(studentId, conv.id, userTurn);

    const recent = await this.conversations.recentTurns(studentId, conv.id);
    const history = recent
      .slice(0, -1)
      .map((t) => ({ role: t.role === "maya" ? "assistant" : "user", content: t.text }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Surface the conversation id immediately so the client can show
    // the persisted thread before the first delta lands.
    res.write(`event: meta\ndata: ${JSON.stringify({ conversationId: conv.id })}\n\n`);

    let accumulated = "";
    let validated = false;

    try {
      const upstream = await fetch(`${this.tutorUrl}/chat/stream`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          message: input.message,
          topic_id: input.topicId ?? conv.topicId,
          history,
        }),
      });
      if (!upstream.ok || !upstream.body) {
        throw new Error(`upstream ${upstream.status}`);
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are delimited by a blank line.
        let split = buffer.indexOf("\n\n");
        while (split >= 0) {
          const rawEvent = buffer.slice(0, split);
          buffer = buffer.slice(split + 2);
          this.handleSseFrame(
            rawEvent,
            res,
            (delta) => {
              accumulated += delta;
            },
            (final) => {
              validated = final.validated;
            },
          );
          split = buffer.indexOf("\n\n");
        }
      }
    } catch (err) {
      this.logger.warn(`tutor stream upstream failed: ${(err as Error).message}`);
      const offlineText =
        "(tutor service offline) Once the AI tutor is running, this would be a real streamed response from Maya.";
      res.write(`event: delta\ndata: ${JSON.stringify({ text: offlineText })}\n\n`);
      res.write(
        `event: done\ndata: ${JSON.stringify({
          reply: offlineText,
          validated: false,
        })}\n\n`,
      );
      accumulated = offlineText;
      validated = false;
    }

    // Persist Maya's complete turn after streaming finishes.
    await this.conversations.appendTurn(studentId, conv.id, {
      role: "maya",
      text: accumulated,
      occurredAt: new Date().toISOString(),
      validated,
    });

    res.end();
  }

  /** Forward an SSE frame to the client; surface delta + done to callbacks. */
  private handleSseFrame(
    frame: string,
    res: Response,
    onDelta: (text: string) => void,
    onDone: (final: { validated: boolean }) => void,
  ): void {
    if (!frame.trim()) return;
    res.write(frame + "\n\n");

    const event = frame.match(/^event: (\S+)/m)?.[1];
    const data = frame.match(/^data: (.+)$/m)?.[1];
    if (!event || !data) return;

    try {
      const payload = JSON.parse(data) as { text?: string; validated?: boolean };
      if (event === "delta" && payload.text) onDelta(payload.text);
      if (event === "done") onDone({ validated: Boolean(payload.validated) });
    } catch {
      // Malformed frame from upstream — ignore but keep proxying.
    }
  }

  async checkAnswer(_studentId: string, questionId: string, studentAnswer: string) {
    const question = this.curriculum.getQuestion(questionId);
    if (!question) throw new NotFoundException(`Question not found: ${questionId}`);

    const normalizedStudent = studentAnswer.trim().toLowerCase().replace(/\s+/g, " ");
    const normalizedRef = question.answer.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalizedStudent === normalizedRef) {
      return { questionId, correct: true, validated: true, expected: question.answer };
    }

    try {
      const res = await fetch(`${this.validationUrl}/validate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stem: question.stem, answer: studentAnswer }),
      });
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      const body = (await res.json()) as ValidationUpstreamResponse;
      return {
        questionId,
        correct: body.ok,
        validated: body.status !== "not_verified",
        expected: question.answer,
      };
    } catch (err) {
      this.logger.warn(`validation upstream unavailable: ${(err as Error).message}`);
      return {
        questionId,
        correct: false,
        validated: false,
        expected: question.answer,
      };
    }
  }
}
