import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface SolverStep {
  explanation: string;
  math: string;
}

export interface SolverResponse {
  accepted: boolean;
  finalAnswer: string | null;
  steps: SolverStep[];
  detectedLatex: string | null;
  ocrProvider: string;
  ocrConfidence: number | null;
  detail: string;
}

interface UpstreamResponse {
  accepted: boolean;
  final_answer: string | null;
  steps: { explanation: string; math: string }[];
  detected_latex: string | null;
  ocr_provider: string;
  ocr_confidence: number | null;
  detail: string;
}

@Injectable()
export class SolverService {
  private readonly logger = new Logger(SolverService.name);
  private readonly solverUrl: string;

  constructor(config: ConfigService) {
    this.solverUrl = config.get("SOLVER_SERVICE_URL", "http://localhost:8002");
  }

  async scan(image: Express.Multer.File): Promise<SolverResponse> {
    if (!image?.buffer || image.size === 0) {
      return this.offline("empty image");
    }

    try {
      const form = new FormData();
      form.append(
        "image",
        new Blob([new Uint8Array(image.buffer)], { type: image.mimetype || "image/jpeg" }),
        image.originalname || "scan.jpg",
      );

      const res = await fetch(`${this.solverUrl}/scan`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      return this.fromUpstream((await res.json()) as UpstreamResponse);
    } catch (err) {
      this.logger.warn(`solver upstream unavailable: ${(err as Error).message}`);
      return this.offline((err as Error).message);
    }
  }

  async solveLatex(latex: string): Promise<SolverResponse> {
    if (!latex.trim()) return this.offline("empty latex");
    try {
      const res = await fetch(`${this.solverUrl}/solve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ latex }),
      });
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      return this.fromUpstream((await res.json()) as UpstreamResponse);
    } catch (err) {
      this.logger.warn(`solver upstream unavailable: ${(err as Error).message}`);
      return this.offline((err as Error).message);
    }
  }

  private offline(detail: string): SolverResponse {
    return {
      accepted: false,
      finalAnswer: null,
      steps: [],
      detectedLatex: null,
      ocrProvider: "none",
      ocrConfidence: null,
      detail: `solver offline: ${detail}`,
    };
  }

  private fromUpstream(body: UpstreamResponse): SolverResponse {
    return {
      accepted: body.accepted,
      finalAnswer: body.final_answer,
      steps: body.steps,
      detectedLatex: body.detected_latex,
      ocrProvider: body.ocr_provider,
      ocrConfidence: body.ocr_confidence,
      detail: body.detail,
    };
  }
}
