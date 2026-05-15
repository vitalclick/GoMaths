import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CurriculumService } from "../curriculum/curriculum.service";

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
  ) {
    this.tutorUrl = config.get("TUTOR_SERVICE_URL", "http://localhost:8001");
    this.validationUrl = config.get("VALIDATION_SERVICE_URL", "http://localhost:8003");
  }

  async sendMessage(
    studentId: string,
    input: { message: string; topicId?: string; conversationId?: string },
  ) {
    const conversationId = input.conversationId ?? `conv_${Date.now()}`;
    const payload = { student_id: studentId, message: input.message, topic_id: input.topicId };

    try {
      const res = await fetch(`${this.tutorUrl}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      const body = (await res.json()) as TutorUpstreamResponse;
      return { conversationId, reply: body.reply, validated: body.validated };
    } catch (err) {
      this.logger.warn(`tutor upstream unavailable: ${(err as Error).message}`);
      return {
        conversationId,
        reply:
          "(tutor service offline) Once the AI tutor is running, this would be a real response from Maya. Try again later.",
        validated: false,
      };
    }
  }

  async checkAnswer(_studentId: string, questionId: string, studentAnswer: string) {
    const question = this.curriculum.getQuestion(questionId);
    if (!question) throw new NotFoundException(`Question not found: ${questionId}`);

    // Always do a quick string-equality check first — handles the common case
    // without a network hop.
    const normalizedStudent = studentAnswer.trim().toLowerCase().replace(/\s+/g, " ");
    const normalizedRef = question.answer.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalizedStudent === normalizedRef) {
      return { questionId, correct: true, validated: true, expected: question.answer };
    }

    // Fall back to the SymPy validation service for symbolic equivalence.
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
      // Conservative: if validation service is offline, fall back to the
      // pre-computed reference answer. This is a deliberate Phase 0 stance —
      // we never silently mark a wrong answer correct, but we may miss
      // mathematically-equivalent-but-string-different submissions.
      return {
        questionId,
        correct: false,
        validated: false,
        expected: question.answer,
      };
    }
  }
}
