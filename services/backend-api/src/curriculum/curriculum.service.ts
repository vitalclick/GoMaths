import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Difficulty, Question, Topic, TopicMetadata, TopicSummary } from "./curriculum.types";

/**
 * Phase 0 implementation: curriculum is loaded from the filesystem
 * (`curriculum-data/` at the repo root) on boot. Phase 1 swaps the loader
 * for a Prisma-backed source once the DB is provisioned. The public API of
 * this service does not change between phases.
 */
@Injectable()
export class CurriculumService implements OnModuleInit {
  private readonly logger = new Logger(CurriculumService.name);
  private readonly topicsById = new Map<string, Topic>();
  private readonly questionsByTopic = new Map<string, Question[]>();

  async onModuleInit(): Promise<void> {
    const root = this.resolveCurriculumRoot();
    this.logger.log(`Loading curriculum from ${root}`);
    await this.walk(root);
    this.logger.log(
      `Loaded ${this.topicsById.size} topics, ${[...this.questionsByTopic.values()].reduce((n, qs) => n + qs.length, 0)} questions`,
    );
  }

  listByGrade(grade: number): TopicSummary[] {
    return [...this.topicsById.values()]
      .filter((t) => t.grade === grade)
      .map(({ lessonMarkdown: _ignored, prerequisites: _p, learningOutcomes: _o, ...summary }) => summary);
  }

  getTopic(topicId: string): Topic {
    const t = this.topicsById.get(topicId);
    if (!t) throw new NotFoundException(`Topic not found: ${topicId}`);
    return t;
  }

  listQuestions(topicId: string, difficulty?: Difficulty): Question[] {
    if (!this.topicsById.has(topicId)) {
      throw new NotFoundException(`Topic not found: ${topicId}`);
    }
    const qs = this.questionsByTopic.get(topicId) ?? [];
    return difficulty ? qs.filter((q) => q.difficulty === difficulty) : qs;
  }

  getQuestion(questionId: string): Question | undefined {
    for (const qs of this.questionsByTopic.values()) {
      const q = qs.find((q) => q.id === questionId);
      if (q) return q;
    }
    return undefined;
  }

  private resolveCurriculumRoot(): string {
    const override = process.env.CURRICULUM_ROOT;
    if (override) return path.resolve(override);
    // dist/curriculum/curriculum.service.js → ../../.. → services/backend-api → ../../curriculum-data
    return path.resolve(__dirname, "..", "..", "..", "..", "curriculum-data");
  }

  private async walk(dir: string): Promise<void> {
    let entries: { name: string; isDirectory: () => boolean }[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      this.logger.warn(`Skipping ${dir}: ${(err as Error).message}`);
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const subdir = path.join(dir, entry.name);
      const metadataPath = path.join(subdir, "metadata.json");

      try {
        await fs.access(metadataPath);
        await this.loadTopic(subdir);
      } catch {
        await this.walk(subdir);
      }
    }
  }

  private async loadTopic(topicDir: string): Promise<void> {
    const [metaRaw, questionsRaw, lessonRaw] = await Promise.all([
      fs.readFile(path.join(topicDir, "metadata.json"), "utf8"),
      fs.readFile(path.join(topicDir, "questions.json"), "utf8"),
      fs.readFile(path.join(topicDir, "lesson.md"), "utf8"),
    ]);

    const metadata = JSON.parse(metaRaw) as TopicMetadata;
    const questionsFile = JSON.parse(questionsRaw) as { topicId: string; questions: Question[] };

    const topic: Topic = { ...metadata, lessonMarkdown: lessonRaw };
    this.topicsById.set(topic.topicId, topic);
    this.questionsByTopic.set(
      topic.topicId,
      questionsFile.questions.map((q) => ({ ...q, topicId: topic.topicId })),
    );
  }
}
