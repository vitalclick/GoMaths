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
