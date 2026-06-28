import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface TeacherClassSummary {
  id: string;
  name: string;
  grade: number;
  studentCount: number;
}

export interface RosterStudent {
  id: string;
  displayName: string;
  grade: number;
  enrolledAt: string;
}

export interface ClassProgressEntry {
  studentId: string;
  displayName: string;
  grade: number;
  topicsAttempted: number;
  /** Mean mastery across attempted topics, 0–1 (0 when none attempted). */
  averageMastery: number;
}

/** Mean of a list of 0–1 mastery scores, rounded to 2 dp; 0 when empty. */
export function averageMastery(scores: number[]): number {
  if (scores.length === 0) return 0;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(mean * 100) / 100;
}

/**
 * Teacher-scoped reads: the classes a teacher teaches and the roster of
 * each class. Prisma-backed when DATABASE_URL is set.
 *
 * There is no in-memory authoring path for classes/enrolments (those are
 * created by school-admin flows that live in Prisma), so without a database
 * these endpoints return an honest empty result rather than fabricated
 * demo data.
 */
@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listClasses(userId: string): Promise<TeacherClassSummary[]> {
    if (!this.prisma.enabled) {
      this.logger.warn("DATABASE_URL not set — teacher classes unavailable in in-memory mode");
      return [];
    }
    const teacherId = await this.teacherId(userId);
    const rows = await this.prisma.teacherClass.findMany({
      where: { teacherId },
      select: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            _count: { select: { enrollments: true } },
          },
        },
      },
    });
    return rows
      .map((r) => ({
        id: r.class.id,
        name: r.class.name,
        grade: r.class.grade,
        studentCount: r.class._count.enrollments,
      }))
      .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
  }

  async getRoster(userId: string, classId: string): Promise<RosterStudent[]> {
    if (!this.prisma.enabled) {
      this.logger.warn("DATABASE_URL not set — roster unavailable in in-memory mode");
      return [];
    }
    const teacherId = await this.teacherId(userId);

    // A teacher may only see the roster of a class they actually teach.
    const link = await this.prisma.teacherClass.findUnique({
      where: { teacherId_classId: { teacherId, classId } },
      select: { classId: true },
    });
    if (!link) throw new ForbiddenException("You do not teach this class");

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { classId },
      select: {
        enrolledAt: true,
        student: { select: { id: true, displayName: true, grade: true } },
      },
      orderBy: { student: { displayName: "asc" } },
    });
    return enrollments.map((e) => ({
      id: e.student.id,
      displayName: e.student.displayName,
      grade: e.student.grade,
      enrolledAt: e.enrolledAt.toISOString(),
    }));
  }

  /**
   * Per-student progress for one of the teacher's classes: every enrolled
   * learner with how many topics they've attempted and their average
   * mastery. Students with no activity appear with zeros.
   */
  async getClassProgress(userId: string, classId: string): Promise<ClassProgressEntry[]> {
    if (!this.prisma.enabled) {
      this.logger.warn("DATABASE_URL not set — class progress unavailable in in-memory mode");
      return [];
    }
    const teacherId = await this.teacherId(userId);

    const link = await this.prisma.teacherClass.findUnique({
      where: { teacherId_classId: { teacherId, classId } },
      select: { classId: true },
    });
    if (!link) throw new ForbiddenException("You do not teach this class");

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { classId },
      select: { student: { select: { id: true, displayName: true, grade: true } } },
      orderBy: { student: { displayName: "asc" } },
    });

    const studentIds = enrollments.map((e) => e.student.id);
    const mastery = await this.prisma.topicMastery.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true, masteryScore: true },
    });

    // Group mastery scores by student.
    const byStudent = new Map<string, number[]>();
    for (const m of mastery) {
      const list = byStudent.get(m.studentId) ?? [];
      list.push(m.masteryScore);
      byStudent.set(m.studentId, list);
    }

    return enrollments.map((e) => {
      const scores = byStudent.get(e.student.id) ?? [];
      return {
        studentId: e.student.id,
        displayName: e.student.displayName,
        grade: e.student.grade,
        topicsAttempted: scores.length,
        averageMastery: averageMastery(scores),
      };
    });
  }

  /** JWT carries the User id; teacher data hangs off the Teacher row. */
  private async teacherId(userId: string): Promise<string> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException(`No teacher profile for user ${userId}`);
    return teacher.id;
  }
}
