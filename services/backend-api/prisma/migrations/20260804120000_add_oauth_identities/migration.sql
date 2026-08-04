-- Social sign-in (Google / Apple).
--
-- Accounts created through a provider have no password, so User.passwordHash
-- becomes nullable. UsersService.verifyCredentials fails closed on null so a
-- social-only account can never be logged into with an empty password.
--
-- The flow is documented in src/auth/oauth.service.ts.

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'APPLE');

CREATE TABLE "AuthIdentity" (
  "id"                TEXT NOT NULL,
  "userId"            TEXT NOT NULL,
  "provider"          "AuthProvider" NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "email"             TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthIdentity_provider_providerAccountId_key"
  ON "AuthIdentity"("provider", "providerAccountId");
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

ALTER TABLE "AuthIdentity"
  ADD CONSTRAINT "AuthIdentity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
