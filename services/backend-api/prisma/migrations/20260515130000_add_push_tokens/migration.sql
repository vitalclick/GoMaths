-- A registered Expo push token belongs to one User. A user can have
-- multiple tokens (one per device they sign in on). Unique on the
-- token string itself so duplicate-registrations from the same device
-- become idempotent.

CREATE TYPE "PushPlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

CREATE TABLE "PushToken" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "token"         TEXT NOT NULL,
  "platform"      "PushPlatform" NOT NULL,
  "appSlug"       TEXT NOT NULL,
  "deviceName"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt"     TIMESTAMP(3),

  CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");
CREATE INDEX "PushToken_userId_idx" ON "PushToken"("userId");

ALTER TABLE "PushToken"
  ADD CONSTRAINT "PushToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
