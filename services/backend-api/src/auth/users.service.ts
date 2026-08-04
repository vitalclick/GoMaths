import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import type { RegisterDto } from "./auth.dto";
import type { OAuthProvider } from "./oauth-verifier";
import { PrismaService } from "../prisma/prisma.service";

export type UserRole =
  | "student"
  | "parent"
  | "teacher"
  | "school_admin"
  | "tutor"
  | "internal_admin";
export type Language = "en" | "af" | "zu" | "st" | "xh";

export interface User {
  id: string;
  email: string;
  /** Null for social-only accounts — see createStudentFromProvider. */
  passwordHash: string | null;
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
 * Dual-mode user store. Prisma when DATABASE_URL is set; otherwise an
 * in-memory Map.
 */
@Injectable()
export class UsersService {
  private static readonly SALT_ROUNDS = 12;

  // In-memory fallback.
  private readonly byId = new Map<string, User>();
  private readonly byEmail = new Map<string, string>();
  /** `${provider}:${sub}` → userId. Mirrors the AuthIdentity table. */
  private readonly byIdentity = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  async createStudent(dto: RegisterDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, UsersService.SALT_ROUNDS);

    if (this.prisma.enabled) {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) throw new ConflictException("Email already registered");

      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          role: "STUDENT",
          language: roleLanguage(dto.language),
          student: {
            create: {
              displayName: dto.displayName.trim(),
              grade: dto.grade,
              parentalConsentAt: dto.parentalConsentToken ? new Date() : null,
            },
          },
        },
        include: { student: true },
      });
      return prismaUserToPublic(user);
    }

    if (this.byEmail.has(email)) {
      throw new ConflictException("Email already registered");
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    const user: User = {
      id,
      email,
      passwordHash,
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
    return toPublic(user);
  }

  async verifyCredentials(emailRaw: string, password: string): Promise<PublicUser> {
    const email = emailRaw.trim().toLowerCase();

    if (this.prisma.enabled) {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { student: true },
      });
      // Run bcrypt even on misses to keep response time stable.
      const hash = user?.passwordHash ?? INVALID_HASH;
      const ok = await bcrypt.compare(password, hash);
      if (!user || !ok) throw new UnauthorizedException("Invalid credentials");
      return prismaUserToPublic(user);
    }

    const id = this.byEmail.get(email);
    const user = id ? this.byId.get(id) : undefined;
    const hash = user?.passwordHash ?? INVALID_HASH;
    const ok = await bcrypt.compare(password, hash);
    if (!user || !ok) throw new UnauthorizedException("Invalid credentials");
    return toPublic(user);
  }

  async getById(id: string): Promise<PublicUser | undefined> {
    if (this.prisma.enabled) {
      const u = await this.prisma.user.findUnique({
        where: { id },
        include: { student: true },
      });
      return u ? prismaUserToPublic(u) : undefined;
    }
    const u = this.byId.get(id);
    return u ? toPublic(u) : undefined;
  }

  async findByEmail(emailRaw: string): Promise<PublicUser | undefined> {
    const email = emailRaw.trim().toLowerCase();
    if (this.prisma.enabled) {
      const u = await this.prisma.user.findUnique({
        where: { email },
        include: { student: true },
      });
      return u ? prismaUserToPublic(u) : undefined;
    }
    const id = this.byEmail.get(email);
    const u = id ? this.byId.get(id) : undefined;
    return u ? toPublic(u) : undefined;
  }

  // ----- social identities --------------------------------------------------

  async findByProviderIdentity(
    provider: OAuthProvider,
    subject: string,
  ): Promise<PublicUser | undefined> {
    if (this.prisma.enabled) {
      const identity = await this.prisma.authIdentity.findUnique({
        where: {
          provider_providerAccountId: {
            provider: providerToPrisma(provider),
            providerAccountId: subject,
          },
        },
        include: { user: { include: { student: true } } },
      });
      return identity ? prismaUserToPublic(identity.user) : undefined;
    }

    const userId = this.byIdentity.get(identityKey(provider, subject));
    const u = userId ? this.byId.get(userId) : undefined;
    return u ? toPublic(u) : undefined;
  }

  async linkProviderIdentity(userId: string, identity: ProviderIdentity): Promise<void> {
    if (this.prisma.enabled) {
      await this.prisma.authIdentity.upsert({
        where: {
          provider_providerAccountId: {
            provider: providerToPrisma(identity.provider),
            providerAccountId: identity.subject,
          },
        },
        create: {
          userId,
          provider: providerToPrisma(identity.provider),
          providerAccountId: identity.subject,
          email: identity.email ?? null,
        },
        update: { lastUsedAt: new Date() },
      });
      return;
    }
    this.byIdentity.set(identityKey(identity.provider, identity.subject), userId);
  }

  async touchProviderIdentity(provider: OAuthProvider, subject: string): Promise<void> {
    if (!this.prisma.enabled) return;
    await this.prisma.authIdentity.update({
      where: {
        provider_providerAccountId: {
          provider: providerToPrisma(provider),
          providerAccountId: subject,
        },
      },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Creates a student whose only credential is a social identity. There is
   * no password to hash — `passwordHash` stays null, and password login for
   * this account fails closed in `verifyCredentials`.
   */
  async createStudentFromProvider(input: CreateFromProviderInput): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();

    if (this.prisma.enabled) {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) throw new ConflictException("Email already registered");

      const user = await this.prisma.user.create({
        data: {
          email,
          role: "STUDENT",
          language: roleLanguage(input.language),
          student: {
            create: {
              displayName: input.displayName.trim(),
              grade: input.grade,
              parentalConsentAt: input.parentalConsentGiven ? new Date() : null,
            },
          },
          authIdentities: {
            create: {
              provider: providerToPrisma(input.identity.provider),
              providerAccountId: input.identity.subject,
              email: input.identity.email ?? null,
            },
          },
        },
        include: { student: true },
      });
      return prismaUserToPublic(user);
    }

    if (this.byEmail.has(email)) throw new ConflictException("Email already registered");
    const id = randomUUID();
    const now = new Date().toISOString();
    const user: User = {
      id,
      email,
      passwordHash: null,
      role: "student",
      language: input.language ?? "en",
      displayName: input.displayName.trim(),
      grade: input.grade,
      parentalConsentAt: input.parentalConsentGiven ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.byId.set(id, user);
    this.byEmail.set(email, id);
    this.byIdentity.set(identityKey(input.identity.provider, input.identity.subject), id);
    return toPublic(user);
  }

  /** Test helper — in-memory only. */
  _reset(): void {
    this.byId.clear();
    this.byEmail.clear();
    this.byIdentity.clear();
  }
}

export interface ProviderIdentity {
  provider: OAuthProvider;
  subject: string;
  email?: string;
  emailVerified: boolean;
}

export interface CreateFromProviderInput {
  email: string;
  displayName: string;
  grade: number;
  language?: Language;
  parentalConsentGiven: boolean;
  identity: ProviderIdentity;
}

function identityKey(provider: OAuthProvider, subject: string): string {
  return `${provider}:${subject}`;
}

function providerToPrisma(provider: OAuthProvider): "GOOGLE" | "APPLE" {
  return provider === "google" ? "GOOGLE" : "APPLE";
}

const INVALID_HASH = "$2b$12$invalidhashinvalidhashinvalidhashinvalidhashinvalidhash";

function roleLanguage(l: Language | undefined): "EN" | "AF" | "ZU" | "ST" | "XH" {
  const map: Record<Language, "EN" | "AF" | "ZU" | "ST" | "XH"> = {
    en: "EN",
    af: "AF",
    zu: "ZU",
    st: "ST",
    xh: "XH",
  };
  return map[l ?? "en"];
}

function toPublic(u: User): PublicUser {
  const { passwordHash: _ph, ...rest } = u;
  return rest;
}

interface PrismaUserRow {
  id: string;
  email: string;
  role: "STUDENT" | "PARENT" | "TEACHER" | "SCHOOL_ADMIN" | "TUTOR" | "INTERNAL_ADMIN";
  language: "EN" | "AF" | "ZU" | "ST" | "XH";
  createdAt: Date;
  updatedAt: Date;
  student?: {
    displayName: string;
    grade: number;
    schoolId: string | null;
    parentalConsentAt: Date | null;
  } | null;
}

function prismaUserToPublic(u: PrismaUserRow): PublicUser {
  return {
    id: u.id,
    email: u.email,
    role: u.role.toLowerCase() as UserRole,
    language: u.language.toLowerCase() as Language,
    displayName: u.student?.displayName ?? "",
    grade: u.student?.grade,
    schoolId: u.student?.schoolId ?? undefined,
    parentalConsentAt: u.student?.parentalConsentAt?.toISOString(),
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}
