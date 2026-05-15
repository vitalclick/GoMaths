import {
  BadRequestException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomUUID } from "node:crypto";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Parental-consent flow (POPIA + Children's Act §10/§11).
 *
 * The register endpoint refuses to create a Student < 18 without proof
 * that a parent has clicked an email link this service mailed them.
 *
 * State machine (per ParentalConsent row):
 *
 *   PENDING -----------(parent clicks link)----------> CONFIRMED
 *      |                                                  |
 *      | expiresAt elapsed                                | (register endpoint)
 *      v                                                  v
 *   EXPIRED                                            CONSUMED
 *
 * Tokens are JWTs carrying { sub: consentId, purpose, studentEmail }.
 * The DB stores sha256(token) so we can revoke a leaked one without
 * having to rotate the signing secret.
 *
 * Three secrets are used (independent rotation):
 *   - PARENTAL_CONSENT_INVITE_SECRET    — signs the link sent by email
 *   - PARENTAL_CONSENT_RECEIPT_SECRET   — signs the receipt returned
 *                                          by /confirm and submitted to
 *                                          /register
 *
 * In dev (no secret set) we fall back to the access-token secret; that's
 * fine for local stacks but production must set both.
 *
 * In-memory fallback exists for the same reason the rest of the auth
 * stack has one: so unit tests can run without a DB.
 */
@Injectable()
export class ParentalConsentService {
  private static readonly INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly RECEIPT_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour
  private static readonly LINK_PURPOSE = "parental_consent.invite";
  private static readonly RECEIPT_PURPOSE = "parental_consent.receipt";

  private readonly logger = new Logger(ParentalConsentService.name);
  private readonly inviteSecret: string;
  private readonly receiptSecret: string;
  private readonly publicAppUrl: string;
  /** In-memory fallback when prisma.enabled is false. */
  private readonly store = new Map<string, ConsentRow>();

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    const fallback = config.get<string>("JWT_ACCESS_SECRET", "dev-access-secret-change-me");
    this.inviteSecret = config.get<string>("PARENTAL_CONSENT_INVITE_SECRET", fallback);
    this.receiptSecret = config.get<string>("PARENTAL_CONSENT_RECEIPT_SECRET", fallback);
    this.publicAppUrl = config.get<string>("PUBLIC_APP_URL", "https://app.gomaths.co.za");
  }

  /**
   * Step 1: parent submits their email + the minor's email. Mints a
   * signed invite, persists a PENDING row, and returns the URL to mail.
   *
   * The endpoint is deliberately idempotent on (parentEmail, studentEmail,
   * PENDING) — repeated requests don't create duplicate rows; they
   * re-mail the existing token. Otherwise a typo in the parent email
   * leaves orphan PENDINGs forever.
   */
  async request(
    rawParentEmail: string,
    rawStudentEmail: string,
  ): Promise<{ id: string; inviteUrl: string; expiresAt: string }> {
    const parentEmail = normaliseEmail(rawParentEmail);
    const studentEmail = normaliseEmail(rawStudentEmail);
    if (!parentEmail || !studentEmail) throw new BadRequestException("Invalid email");
    if (parentEmail === studentEmail) {
      throw new BadRequestException("Parent and student emails must differ");
    }

    const expiresAt = new Date(Date.now() + ParentalConsentService.INVITE_TTL_MS);

    // Find an open PENDING for this pair; refresh it rather than duplicate.
    const existing = await this.findPending(parentEmail, studentEmail);
    const id = existing?.id ?? randomUUID();

    const token = await this.jwt.signAsync(
      { sub: id, purpose: ParentalConsentService.LINK_PURPOSE, studentEmail },
      {
        secret: this.inviteSecret,
        expiresIn: Math.floor(ParentalConsentService.INVITE_TTL_MS / 1000),
      },
    );
    const tokenHash = sha256(token);

    if (existing) {
      await this.updatePending(existing.id, tokenHash, expiresAt);
    } else {
      await this.insertPending({ id, parentEmail, studentEmail, tokenHash, expiresAt });
    }

    const inviteUrl = `${this.publicAppUrl}/parental-consent/confirm?token=${encodeURIComponent(token)}`;

    this.logger.log(
      `Parental-consent invite: parent=${parentEmail} student=${studentEmail} id=${id}`,
    );
    // MailService transparently picks Resend or the log-only fallback
    // based on RESEND_API_KEY. Send is fire-and-forget — the consent
    // row is already PENDING, the parent can retry /request if the
    // mail never lands.
    await this.mail.sendParentalConsentInvite({ parentEmail, studentEmail, inviteUrl });

    return { id, inviteUrl, expiresAt: expiresAt.toISOString() };
  }

  /**
   * Step 2: parent clicks the email link. Validates the invite JWT,
   * marks the row CONFIRMED, and returns a short-lived receipt that
   * the registration form submits.
   */
  async confirm(
    inviteToken: string,
    audit: { ip?: string; userAgent?: string } = {},
  ): Promise<{ studentEmail: string; receiptToken: string; expiresAt: string }> {
    const payload = await this.verify(
      inviteToken,
      this.inviteSecret,
      ParentalConsentService.LINK_PURPOSE,
    );
    const inviteHash = sha256(inviteToken);

    const row = await this.findByHash(inviteHash);
    if (!row) throw new NotFoundException("Consent record not found");
    if (row.status === "CONSUMED") throw new GoneException("Consent already used");
    if (row.status === "EXPIRED" || row.expiresAt.getTime() < Date.now()) {
      throw new GoneException("Consent invite expired");
    }
    if (row.studentEmail !== payload.studentEmail) {
      throw new UnauthorizedException("Token does not match record");
    }

    await this.markConfirmed(row.id, {
      ip: audit.ip,
      uaHash: audit.userAgent ? sha256(audit.userAgent) : undefined,
    });

    const receiptExpiresAt = new Date(Date.now() + ParentalConsentService.RECEIPT_TTL_MS);
    const receiptToken = await this.jwt.signAsync(
      {
        sub: row.id,
        purpose: ParentalConsentService.RECEIPT_PURPOSE,
        studentEmail: row.studentEmail,
      },
      {
        secret: this.receiptSecret,
        expiresIn: Math.floor(ParentalConsentService.RECEIPT_TTL_MS / 1000),
      },
    );

    return {
      studentEmail: row.studentEmail,
      receiptToken,
      expiresAt: receiptExpiresAt.toISOString(),
    };
  }

  /**
   * Step 2b (optional, app-driven): the student app polls this with the
   * consent ID it got from /request and the minor's email. Returns the
   * row status and — exactly once, the first time the row is CONFIRMED
   * — a fresh receipt token. Subsequent CONFIRMED polls return no
   * receipt, so a compromised poller can't replay.
   */
  async poll(
    id: string,
    rawStudentEmail: string,
  ): Promise<{
    status: "PENDING" | "CONFIRMED" | "CONSUMED" | "EXPIRED";
    receiptToken?: string;
    expiresAt?: string;
  }> {
    const studentEmail = normaliseEmail(rawStudentEmail);
    const row = await this.findById(id);
    if (!row) throw new NotFoundException("Consent record not found");
    if (row.studentEmail !== studentEmail) {
      // Same shape as "not found" so an attacker can't probe IDs.
      throw new NotFoundException("Consent record not found");
    }

    let status = row.status;
    if (status !== "CONSUMED" && row.expiresAt.getTime() < Date.now()) {
      await this.markExpired(row.id);
      status = "EXPIRED";
    }
    if (status !== "CONFIRMED") return { status };

    // Already issued — return status only, no fresh receipt.
    if (await this.hasReceiptBeenIssued(row.id)) return { status };

    const receiptExpiresAt = new Date(Date.now() + ParentalConsentService.RECEIPT_TTL_MS);
    const receiptToken = await this.jwt.signAsync(
      {
        sub: row.id,
        purpose: ParentalConsentService.RECEIPT_PURPOSE,
        studentEmail: row.studentEmail,
      },
      {
        secret: this.receiptSecret,
        expiresIn: Math.floor(ParentalConsentService.RECEIPT_TTL_MS / 1000),
      },
    );
    await this.markReceiptIssued(row.id);
    return { status, receiptToken, expiresAt: receiptExpiresAt.toISOString() };
  }

  /**
   * Step 3: called by AuthService.register for under-18 sign-ups.
   * Verifies the receipt matches a CONFIRMED row and moves it to
   * CONSUMED. Throws if the receipt is missing, forged, expired, or
   * already used.
   */
  async consumeForRegistration(receiptToken: string, registeringEmail: string): Promise<void> {
    const studentEmail = normaliseEmail(registeringEmail);
    const payload = await this.verify(
      receiptToken,
      this.receiptSecret,
      ParentalConsentService.RECEIPT_PURPOSE,
    );
    if (payload.studentEmail !== studentEmail) {
      throw new UnauthorizedException("Consent receipt does not match account email");
    }

    const row = await this.findById(payload.sub);
    if (!row) throw new NotFoundException("Consent record not found");
    if (row.status !== "CONFIRMED") {
      throw new UnauthorizedException("Consent is not confirmed");
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new GoneException("Consent expired");
    }
    await this.markConsumed(row.id);
  }

  // ----- persistence helpers ----------------------------------------------

  private async verify(
    token: string,
    secret: string,
    purpose: string,
  ): Promise<{ sub: string; studentEmail: string }> {
    try {
      const decoded = await this.jwt.verifyAsync<{
        sub: string;
        studentEmail: string;
        purpose?: string;
      }>(token, { secret });
      if (decoded.purpose !== purpose) {
        throw new UnauthorizedException("Wrong token purpose");
      }
      return { sub: decoded.sub, studentEmail: normaliseEmail(decoded.studentEmail) };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException("Invalid or expired consent token");
    }
  }

  private async findPending(parentEmail: string, studentEmail: string): Promise<ConsentRow | null> {
    if (this.prisma.enabled) {
      const row = await this.prisma.parentalConsent.findFirst({
        where: { parentEmail, studentEmail, status: "PENDING" },
      });
      return row as ConsentRow | null;
    }
    for (const row of this.store.values()) {
      if (
        row.parentEmail === parentEmail &&
        row.studentEmail === studentEmail &&
        row.status === "PENDING"
      ) {
        return row;
      }
    }
    return null;
  }

  private async findByHash(tokenHash: string): Promise<ConsentRow | null> {
    if (this.prisma.enabled) {
      const row = await this.prisma.parentalConsent.findUnique({ where: { tokenHash } });
      return row as ConsentRow | null;
    }
    for (const row of this.store.values()) {
      if (row.tokenHash === tokenHash) return row;
    }
    return null;
  }

  private async findById(id: string): Promise<ConsentRow | null> {
    if (this.prisma.enabled) {
      const row = await this.prisma.parentalConsent.findUnique({ where: { id } });
      return row as ConsentRow | null;
    }
    return this.store.get(id) ?? null;
  }

  private async insertPending(
    row: Omit<
      ConsentRow,
      | "status"
      | "createdAt"
      | "confirmedAt"
      | "consumedAt"
      | "confirmIp"
      | "confirmUaHash"
      | "receiptIssuedAt"
    >,
  ): Promise<void> {
    if (this.prisma.enabled) {
      await this.prisma.parentalConsent.create({
        data: {
          id: row.id,
          parentEmail: row.parentEmail,
          studentEmail: row.studentEmail,
          tokenHash: row.tokenHash,
          expiresAt: row.expiresAt,
        },
      });
      return;
    }
    this.store.set(row.id, {
      id: row.id,
      parentEmail: row.parentEmail,
      studentEmail: row.studentEmail,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      status: "PENDING",
      createdAt: new Date(),
      confirmedAt: null,
      consumedAt: null,
      confirmIp: null,
      confirmUaHash: null,
      receiptIssuedAt: null,
    });
  }

  private async updatePending(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
    if (this.prisma.enabled) {
      await this.prisma.parentalConsent.update({
        where: { id },
        data: { tokenHash, expiresAt, status: "PENDING" },
      });
      return;
    }
    const existing = this.store.get(id);
    if (existing) {
      existing.tokenHash = tokenHash;
      existing.expiresAt = expiresAt;
      existing.status = "PENDING";
    }
  }

  private async markConfirmed(id: string, audit: { ip?: string; uaHash?: string }): Promise<void> {
    const now = new Date();
    if (this.prisma.enabled) {
      await this.prisma.parentalConsent.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedAt: now,
          confirmIp: audit.ip ?? null,
          confirmUaHash: audit.uaHash ?? null,
        },
      });
      return;
    }
    const row = this.store.get(id);
    if (row) {
      row.status = "CONFIRMED";
      row.confirmedAt = now;
      row.confirmIp = audit.ip ?? null;
      row.confirmUaHash = audit.uaHash ?? null;
    }
  }

  private async hasReceiptBeenIssued(id: string): Promise<boolean> {
    if (this.prisma.enabled) {
      const row = await this.prisma.parentalConsent.findUnique({
        where: { id },
        select: { receiptIssuedAt: true },
      });
      return Boolean(row?.receiptIssuedAt);
    }
    return Boolean(this.store.get(id)?.receiptIssuedAt);
  }

  private async markReceiptIssued(id: string): Promise<void> {
    const now = new Date();
    if (this.prisma.enabled) {
      await this.prisma.parentalConsent.update({
        where: { id },
        data: { receiptIssuedAt: now },
      });
      return;
    }
    const row = this.store.get(id);
    if (row) row.receiptIssuedAt = now;
  }

  private async markExpired(id: string): Promise<void> {
    if (this.prisma.enabled) {
      await this.prisma.parentalConsent.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
      return;
    }
    const row = this.store.get(id);
    if (row) row.status = "EXPIRED";
  }

  private async markConsumed(id: string): Promise<void> {
    const now = new Date();
    if (this.prisma.enabled) {
      await this.prisma.parentalConsent.update({
        where: { id },
        data: { status: "CONSUMED", consumedAt: now },
      });
      return;
    }
    const row = this.store.get(id);
    if (row) {
      row.status = "CONSUMED";
      row.consumedAt = now;
    }
  }

  /** Test helper — in-memory only. */
  _reset(): void {
    this.store.clear();
  }
}

interface ConsentRow {
  id: string;
  parentEmail: string;
  studentEmail: string;
  tokenHash: string;
  status: "PENDING" | "CONFIRMED" | "CONSUMED" | "EXPIRED";
  expiresAt: Date;
  createdAt: Date;
  confirmedAt: Date | null;
  consumedAt: Date | null;
  confirmIp: string | null;
  confirmUaHash: string | null;
  receiptIssuedAt: Date | null;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function normaliseEmail(raw: string): string {
  return (raw ?? "").trim().toLowerCase();
}
