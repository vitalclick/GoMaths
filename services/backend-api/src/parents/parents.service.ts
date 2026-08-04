import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface LinkedChild {
  email: string;
  displayName: string;
  grade: number | null;
  /** When the parental consent for this child was confirmed. */
  linkedAt: string;
}

/**
 * Parent-facing read APIs.
 *
 * Phase 1 keeps this thin: the only thing a parent can do today is see
 * the children whose parental-consent record they signed. Linking is
 * derived from the ParentalConsent table — the parent's email matches
 * `parentEmail` and the row is in the terminal CONSUMED state.
 *
 * Phase 1.5 expands this with: per-child progress summary (mastery,
 * recent topics, streak), weekly digest opt-in, invite-link issuance,
 * privacy controls (revoke linkage, request data deletion).
 *
 * Dual-mode: returns an empty list in non-Prisma dev mode, since the
 * in-memory consent store is per-process and unlikely to span the
 * parent app's session.
 */
@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listChildren(parentEmail: string): Promise<LinkedChild[]> {
    const normalised = parentEmail.trim().toLowerCase();
    if (!this.prisma.enabled) return [];

    const consents = await this.prisma.parentalConsent.findMany({
      where: { parentEmail: normalised, status: "CONSUMED" },
      orderBy: { consumedAt: "desc" },
      select: { studentEmail: true, consumedAt: true, confirmedAt: true },
    });
    if (consents.length === 0) return [];

    const studentEmails = consents.map((c: { studentEmail: string }) => c.studentEmail);
    const users = await this.prisma.user.findMany({
      where: { email: { in: studentEmails }, role: "STUDENT" },
      include: { student: true },
    });

    type UserWithStudent = {
      email: string;
      student: { displayName: string; grade: number | null } | null;
    };
    const byEmail = new Map((users as UserWithStudent[]).map((u) => [u.email, u]));
    const out: LinkedChild[] = [];
    for (const c of consents) {
      const u = byEmail.get(c.studentEmail);
      // Skip consents where the child hasn't actually finished registering
      // (CONSUMED + no User row — possible if registration aborted after
      // the receipt was consumed; should be rare).
      if (!u || !u.student) continue;
      out.push({
        email: u.email,
        displayName: u.student.displayName,
        grade: u.student.grade,
        linkedAt: (c.consumedAt ?? c.confirmedAt ?? new Date()).toISOString(),
      });
    }
    return out;
  }
}
