import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ParentalConsentService } from "./parental-consent.service";
import { UsersService } from "./users.service";
import type { MailService } from "../mail/mail.service";
import type { PrismaService } from "../prisma/prisma.service";

function makeService() {
  const prismaStub = { enabled: false } as unknown as PrismaService;
  const users = new UsersService(prismaStub);
  const jwt = new JwtService({ secret: "test-access-secret", signOptions: { expiresIn: "15m" } });
  const config = {
    get: (_key: string, fallback: string) => fallback,
  } as unknown as ConfigService;
  const mailStub = { sendParentalConsentInvite: async () => undefined } as unknown as MailService;
  const consent = new ParentalConsentService(jwt, prismaStub, mailStub, config);
  return {
    auth: new AuthService(users, jwt, prismaStub, consent, config),
    users,
    jwt,
    consent,
  };
}

const ADULT_BIRTH_YEAR = new Date().getUTCFullYear() - 25;
const MINOR_BIRTH_YEAR = new Date().getUTCFullYear() - 12;

const VALID_REGISTRATION = {
  email: "student@example.com",
  password: "longenoughpassword",
  displayName: "Test Student",
  grade: 9,
  birthYear: ADULT_BIRTH_YEAR,
};

describe("AuthService (in-memory)", () => {
  it("registers a student and returns a session", async () => {
    const { auth } = makeService();
    const session = await auth.register(VALID_REGISTRATION);
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
    expect(session.user.email).toBe(VALID_REGISTRATION.email);
    expect(session.user).not.toHaveProperty("passwordHash");
  });

  it("rejects login with the wrong password", async () => {
    const { auth } = makeService();
    await auth.register(VALID_REGISTRATION);
    await expect(
      auth.login({ email: VALID_REGISTRATION.email, password: "wrong" }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("accepts login with the correct password", async () => {
    const { auth } = makeService();
    await auth.register(VALID_REGISTRATION);
    const session = await auth.login({
      email: VALID_REGISTRATION.email,
      password: VALID_REGISTRATION.password,
    });
    expect(session.user.email).toBe(VALID_REGISTRATION.email);
  });

  it("rotates refresh tokens and rejects reuse", async () => {
    const { auth } = makeService();
    const session1 = await auth.register(VALID_REGISTRATION);
    const session2 = await auth.refresh(session1.refreshToken);
    expect(session2.refreshToken).not.toBe(session1.refreshToken);
    await expect(auth.refresh(session1.refreshToken)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects unknown refresh tokens", async () => {
    const { auth } = makeService();
    await expect(auth.refresh("not-a-real-token")).rejects.toThrow(UnauthorizedException);
  });

  describe("parental consent", () => {
    it("blocks minor registration when no consent token is supplied", async () => {
      const { auth } = makeService();
      await expect(
        auth.register({ ...VALID_REGISTRATION, birthYear: MINOR_BIRTH_YEAR }),
      ).rejects.toThrow(BadRequestException);
    });

    it("accepts minor registration once consent has been requested + confirmed", async () => {
      const { auth, consent } = makeService();
      const { inviteUrl } = await consent.request("parent@example.com", VALID_REGISTRATION.email);
      const inviteToken = new URL(inviteUrl).searchParams.get("token")!;
      const { receiptToken } = await consent.confirm(inviteToken);
      const session = await auth.register({
        ...VALID_REGISTRATION,
        birthYear: MINOR_BIRTH_YEAR,
        parentalConsentToken: receiptToken,
      });
      expect(session.user.email).toBe(VALID_REGISTRATION.email);
    });

    it("rejects a receipt issued for a different email", async () => {
      const { auth, consent } = makeService();
      const { inviteUrl } = await consent.request("parent@example.com", "other@example.com");
      const inviteToken = new URL(inviteUrl).searchParams.get("token")!;
      const { receiptToken } = await consent.confirm(inviteToken);
      await expect(
        auth.register({
          ...VALID_REGISTRATION,
          birthYear: MINOR_BIRTH_YEAR,
          parentalConsentToken: receiptToken,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("poll returns the receipt exactly once after the parent confirms", async () => {
      const { consent } = makeService();
      const { id, inviteUrl } = await consent.request(
        "parent@example.com",
        VALID_REGISTRATION.email,
      );
      const inviteToken = new URL(inviteUrl).searchParams.get("token")!;

      // Before parent confirms.
      const pendingPoll = await consent.poll(id, VALID_REGISTRATION.email);
      expect(pendingPoll.status).toBe("PENDING");
      expect(pendingPoll.receiptToken).toBeUndefined();

      // Parent confirms (via /confirm — separate code path from polling).
      await consent.confirm(inviteToken);

      // First poll after CONFIRMED carries a receipt.
      const firstPoll = await consent.poll(id, VALID_REGISTRATION.email);
      expect(firstPoll.status).toBe("CONFIRMED");
      expect(firstPoll.receiptToken).toBeTruthy();

      // Second poll: still CONFIRMED but no fresh receipt.
      const secondPoll = await consent.poll(id, VALID_REGISTRATION.email);
      expect(secondPoll.status).toBe("CONFIRMED");
      expect(secondPoll.receiptToken).toBeUndefined();
    });

    it("poll rejects ID + email mismatch as not-found", async () => {
      const { consent } = makeService();
      const { id } = await consent.request("parent@example.com", VALID_REGISTRATION.email);
      await expect(consent.poll(id, "different@example.com")).rejects.toThrow();
    });

    it("refuses to consume the same receipt twice", async () => {
      const { auth, consent } = makeService();
      const { inviteUrl } = await consent.request("parent@example.com", VALID_REGISTRATION.email);
      const inviteToken = new URL(inviteUrl).searchParams.get("token")!;
      const { receiptToken } = await consent.confirm(inviteToken);
      await auth.register({
        ...VALID_REGISTRATION,
        birthYear: MINOR_BIRTH_YEAR,
        parentalConsentToken: receiptToken,
      });
      // Second use is rejected — the row is CONSUMED, not CONFIRMED.
      await expect(
        auth.register({
          ...VALID_REGISTRATION,
          email: "other-student@example.com",
          birthYear: MINOR_BIRTH_YEAR,
          parentalConsentToken: receiptToken,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
