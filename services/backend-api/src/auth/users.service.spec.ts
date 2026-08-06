import { NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
import type { PrismaService } from "../prisma/prisma.service";

function makeService() {
  const prismaStub = { enabled: false } as unknown as PrismaService;
  return new UsersService(prismaStub);
}

const ADULT_BIRTH_YEAR = new Date().getUTCFullYear() - 25;

describe("UsersService.updateProfile", () => {
  it("updates the display name only", async () => {
    const users = makeService();
    const created = await users.createStudent({
      email: "grade-bump@example.com",
      password: "longenoughpassword",
      displayName: "Old Name",
      grade: 9,
      birthYear: ADULT_BIRTH_YEAR,
    });

    const updated = await users.updateProfile(created.id, { displayName: "New Name" });

    expect(updated.displayName).toBe("New Name");
    expect(updated.grade).toBe(9);
  });

  it("updates the grade only", async () => {
    const users = makeService();
    const created = await users.createStudent({
      email: "grade-bump2@example.com",
      password: "longenoughpassword",
      displayName: "Thabo",
      grade: 9,
      birthYear: ADULT_BIRTH_YEAR,
    });

    const updated = await users.updateProfile(created.id, { grade: 10 });

    expect(updated.grade).toBe(10);
    expect(updated.displayName).toBe("Thabo");
  });

  it("updates both fields together", async () => {
    const users = makeService();
    const created = await users.createStudent({
      email: "both@example.com",
      password: "longenoughpassword",
      displayName: "Old",
      grade: 9,
      birthYear: ADULT_BIRTH_YEAR,
    });

    const updated = await users.updateProfile(created.id, { displayName: "New", grade: 11 });

    expect(updated.displayName).toBe("New");
    expect(updated.grade).toBe(11);
  });

  it("trims a display name with surrounding whitespace", async () => {
    const users = makeService();
    const created = await users.createStudent({
      email: "trim@example.com",
      password: "longenoughpassword",
      displayName: "Original",
      grade: 9,
      birthYear: ADULT_BIRTH_YEAR,
    });

    const updated = await users.updateProfile(created.id, { displayName: "  Padded  " });

    expect(updated.displayName).toBe("Padded");
  });

  it("rejects an unknown user id", async () => {
    const users = makeService();
    await expect(users.updateProfile("not-a-real-id", { displayName: "X" })).rejects.toThrow(
      NotFoundException,
    );
  });

  it("leaves fields untouched when the corresponding input is omitted", async () => {
    const users = makeService();
    const created = await users.createStudent({
      email: "noop@example.com",
      password: "longenoughpassword",
      displayName: "Unchanged",
      grade: 9,
      birthYear: ADULT_BIRTH_YEAR,
    });

    const updated = await users.updateProfile(created.id, {});

    expect(updated.displayName).toBe("Unchanged");
    expect(updated.grade).toBe(9);
  });
});
