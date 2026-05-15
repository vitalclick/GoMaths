import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UsersService } from "./users.service";
import type { PrismaService } from "../prisma/prisma.service";

function makeService() {
  const prismaStub = { enabled: false } as unknown as PrismaService;
  const users = new UsersService(prismaStub);
  const jwt = new JwtService({ secret: "test-access-secret", signOptions: { expiresIn: "15m" } });
  const config = {
    get: (_key: string, fallback: string) => fallback,
  } as unknown as ConfigService;
  return { auth: new AuthService(users, jwt, prismaStub, config), users, jwt };
}

const VALID_REGISTRATION = {
  email: "student@example.com",
  password: "longenoughpassword",
  displayName: "Test Student",
  grade: 9,
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
});
