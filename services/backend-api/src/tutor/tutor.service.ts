import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
