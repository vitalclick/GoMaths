import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import type { RegisterDto } from "./auth.dto";

export type UserRole = "student" | "parent" | "teacher" | "school_admin" | "tutor" | "internal_admin";
export type Language = "en" | "af" | "zu" | "st" | "xh";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  language: Language;
  displayName: string;
  grade?: number;
  schoolId?: string;
  parentalConsentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, "passwordHash">;

/**
 * Phase 0+ in-memory user store. Phase 1 swaps for a Prisma implementation
 * backed by the `User` table in `prisma/schema.prisma`. The methods on this
 * service are intentionally stable across that swap — no caller should need
 * to change when storage moves.
 *
 * Phase 1 should also enforce parental consent for under-18 sign-ups
 * (currently accepted as a string token without verification).
 */
@Injectable()
export class UsersService {
  private readonly byId = new Map<string, User>();
  private readonly byEmail = new Map<string, string>();

  private static readonly SALT_ROUNDS = 12;

  async createStudent(dto: RegisterDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    if (this.byEmail.has(email)) {
      throw new ConflictException("Email already registered");
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const user: User = {
      id,
      email,
      passwordHash: await bcrypt.hash(dto.password, UsersService.SALT_ROUNDS),
      role: "student",
      language: dto.language ?? "en",
      displayName: dto.displayName.trim(),
      grade: dto.grade,
      parentalConsentAt: dto.parentalConsentToken ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.byId.set(id, user);
    this.byEmail.set(email, id);
    return this.toPublic(user);
  }

  async verifyCredentials(emailRaw: string, password: string): Promise<PublicUser> {
    const email = emailRaw.trim().toLowerCase();
    const id = this.byEmail.get(email);
    const user = id ? this.byId.get(id) : undefined;

    // Always run bcrypt.compare to keep response time stable even when the
    // user doesn't exist — guards against email-existence timing attacks.
    const hash = user?.passwordHash ?? "$2b$12$invalidhashinvalidhashinvalidhashinvalidhashinvalidhash";
    const ok = await bcrypt.compare(password, hash);

    if (!user || !ok) throw new UnauthorizedException("Invalid credentials");
    return this.toPublic(user);
  }

  getById(id: string): PublicUser | undefined {
    const u = this.byId.get(id);
    return u ? this.toPublic(u) : undefined;
  }

  private toPublic(u: User): PublicUser {
    const { passwordHash: _ph, ...rest } = u;
    return rest;
  }

  /** Test helper. */
  _reset(): void {
    this.byId.clear();
    this.byEmail.clear();
  }
}
