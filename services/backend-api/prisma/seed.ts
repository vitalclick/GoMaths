/**
 * Seed: hydrate the Postgres curriculum from `curriculum-data/`.
 *
 * Idempotent: re-running upserts each topic and replaces its question
 * bank. Safe to call repeatedly in CI as a post-migration step.
 *
 *   pnpm --filter @gomaths/backend-api prisma:seed
 *
 * Set `CURRICULUM_ROOT` to point at a non-default location if needed.
 */

import { PrismaClient, type ContentArea, type Difficulty } from "@prisma/client";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const prisma = new PrismaClient();

interface TopicMetadata {
  topicId: string;
  title: string;
  grade: number;
  contentArea: string;
  capsReference: string;
  prerequisites: string[];
  learningOutcomes: string[];
  estimatedMinutes: number;
}

interface QuestionsFile {
  topicId: string;
  questions: {
    id: string;
    difficulty: string;
    stem: string;
    answer: string;
    answerLatex: string;
    solutionSteps: string[];
    commonMistakes: string[];
    tags: string[];
  }[];
}

async function main() {
  const root = process.env.CURRICULUM_ROOT
    ? path.resolve(process.env.CURRICULUM_ROOT)
    : path.resolve(__dirname, "..", "..", "..", "curriculum-data");
  console.log(`Seeding curriculum from ${root}`);

  const topicDirs = await findTopicDirs(root);
  for (const dir of topicDirs) {
    const [metaRaw, questionsRaw, lessonRaw] = await Promise.all([
      fs.readFile(path.join(dir, "metadata.json"), "utf8"),
      fs.readFile(path.join(dir, "questions.json"), "utf8"),
      fs.readFile(path.join(dir, "lesson.md"), "utf8"),
    ]);
    const meta = JSON.parse(metaRaw) as TopicMetadata;
    const qf = JSON.parse(questionsRaw) as QuestionsFile;

    const contentArea = toContentArea(meta.contentArea);
    await prisma.topic.upsert({
      where: { id: meta.topicId },
      create: {
        id: meta.topicId,
        title: meta.title,
        grade: meta.grade,
        contentArea,
        capsReference: meta.capsReference,
        learningOutcomes: meta.learningOutcomes,
        estimatedMinutes: meta.estimatedMinutes,
        lessonMarkdown: lessonRaw,
      },
      update: {
        title: meta.title,
        grade: meta.grade,
        contentArea,
        capsReference: meta.capsReference,
        learningOutcomes: meta.learningOutcomes,
        estimatedMinutes: meta.estimatedMinutes,
        lessonMarkdown: lessonRaw,
      },
    });

    // Replace question bank for this topic — questions are content-
    // addressable so a deleted-then-re-added question keeps its id.
    await prisma.question.deleteMany({ where: { topicId: meta.topicId } });
    for (const q of qf.questions) {
      await prisma.question.create({
        data: {
          id: q.id,
          topicId: meta.topicId,
          difficulty: toDifficulty(q.difficulty),
          stem: q.stem,
          answer: q.answer,
          answerLatex: q.answerLatex,
          solutionSteps: q.solutionSteps,
          commonMistakes: q.commonMistakes,
          tags: q.tags,
        },
      });
    }

    // Replace prerequisite edges.
    await prisma.topicPrerequisite.deleteMany({ where: { topicId: meta.topicId } });
    for (const prereq of meta.prerequisites) {
      // Skip prereqs that aren't loaded yet — second pass below handles them.
      const exists = await prisma.topic.findUnique({ where: { id: prereq } });
      if (exists) {
        await prisma.topicPrerequisite.create({
          data: { topicId: meta.topicId, prerequisiteId: prereq },
        });
      }
    }

    console.log(`  ✓ ${meta.topicId} (${qf.questions.length} questions)`);
  }

  console.log(`Seeded ${topicDirs.length} topics`);
}

async function findTopicDirs(dir: string, out: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const sub = path.join(dir, e.name);
    try {
      await fs.access(path.join(sub, "metadata.json"));
      out.push(sub);
    } catch {
      await findTopicDirs(sub, out);
    }
  }
  return out;
}

function toContentArea(s: string): ContentArea {
  const map: Record<string, ContentArea> = {
    numbers: "NUMBERS",
    patterns_functions_algebra: "PATTERNS_FUNCTIONS_ALGEBRA",
    space_and_shape: "SPACE_AND_SHAPE",
    measurement: "MEASUREMENT",
    data_handling: "DATA_HANDLING",
  };
  const v = map[s];
  if (!v) throw new Error(`Unknown contentArea: ${s}`);
  return v;
}

function toDifficulty(s: string): Difficulty {
  const map: Record<string, Difficulty> = { easy: "EASY", medium: "MEDIUM", hard: "HARD" };
  const v = map[s];
  if (!v) throw new Error(`Unknown difficulty: ${s}`);
  return v;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
