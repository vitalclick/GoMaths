-- Parental consent records for under-18 sign-ups (POPIA + Children's Act).
-- A parent submits the minor's email; backend mints a signed JWT and mails
-- it to the parent. The flow is documented in
-- src/auth/parental-consent.service.ts.

CREATE TYPE "ParentalConsentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CONSUMED', 'EXPIRED');

CREATE TABLE "ParentalConsent" (
  "id"            TEXT NOT NULL,
  "parentEmail"   TEXT NOT NULL,
  "studentEmail"  TEXT NOT NULL,
  "tokenHash"     TEXT NOT NULL,
  "status"        "ParentalConsentStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt"     TIMESTAMP(3) NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt"   TIMESTAMP(3),
  "consumedAt"    TIMESTAMP(3),
  "confirmIp"       TEXT,
  "confirmUaHash"   TEXT,
  "receiptIssuedAt" TIMESTAMP(3),

  CONSTRAINT "ParentalConsent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ParentalConsent_tokenHash_key" ON "ParentalConsent"("tokenHash");
CREATE INDEX "ParentalConsent_studentEmail_status_idx" ON "ParentalConsent"("studentEmail", "status");
CREATE INDEX "ParentalConsent_expiresAt_idx" ON "ParentalConsent"("expiresAt");
