import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Transactional email transport.
 *
 * Provider selection (in priority order, first match wins):
 *
 *   - `RESEND_API_KEY` set ⇒ Resend HTTP API. Plenty for the preview
 *     deploy — they have a generous free tier and the API surface is
 *     "POST /emails with JSON".
 *   - Otherwise ⇒ a no-op provider that logs the payload. Dev mode +
 *     CI tests run on this path so they need no network.
 *
 * Adding a new transport (Postmark, SES, Mailgun): implement
 * `MailProvider`, add a branch in the constructor, no other callers
 * change. Phase 1 deferred decision: pick a SA-friendly provider
 * (Mailgun EU works; Resend is US-only at the time of writing — fine
 * for a preview, may need revisiting for POPIA when traffic scales).
 *
 * All public methods are best-effort: a transport failure is logged
 * but never bubbled, because email is an out-of-band side-effect of
 * an HTTP request that has its own success path (the consent record
 * is already persisted before we mail). The DB row is the source of
 * truth; the email is a notification.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly provider: MailProvider;
  private readonly from: string;

  constructor(config: ConfigService) {
    const resendKey = config.get<string>("RESEND_API_KEY");
    this.from = config.get<string>("EMAIL_FROM", "GoMaths <onboarding@resend.dev>");

    if (resendKey) {
      this.logger.log("Mail transport: Resend");
      this.provider = new ResendProvider(resendKey, this.from, this.logger);
    } else {
      this.logger.warn("Mail transport: log-only (RESEND_API_KEY not set)");
      this.provider = new LogProvider(this.logger);
    }
  }

  /**
   * Mails the parent the invite link they need to click to confirm
   * consent. URL points at the public app's /parental-consent/confirm
   * page which calls /auth/parental-consent/confirm with the token.
   */
  async sendParentalConsentInvite(input: {
    parentEmail: string;
    studentEmail: string;
    inviteUrl: string;
  }): Promise<void> {
    const { parentEmail, studentEmail, inviteUrl } = input;
    const subject = "Please confirm GoMaths for your child";
    const html = parentalConsentEmailHtml({ studentEmail, inviteUrl });
    const text = parentalConsentEmailText({ studentEmail, inviteUrl });

    try {
      await this.provider.send({ to: parentEmail, subject, html, text });
    } catch (err) {
      // Don't fail the request — the consent row is already PENDING and
      // the parent can /request again if the mail never lands.
      this.logger.error(
        `Mail send failed for parental-consent invite to ${parentEmail}: ${(err as Error).message}`,
      );
    }
  }
}

interface MailProvider {
  send(input: { to: string; subject: string; html: string; text: string }): Promise<void>;
}

class ResendProvider implements MailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly logger: Logger,
  ) {}

  async send(input: { to: string; subject: string; html: string; text: string }): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "<unreadable>");
      throw new Error(`Resend ${res.status}: ${body}`);
    }
    this.logger.log(`Resend: delivered to ${input.to}`);
  }
}

class LogProvider implements MailProvider {
  constructor(private readonly logger: Logger) {}
  async send(input: { to: string; subject: string; html: string; text: string }): Promise<void> {
    this.logger.log(
      `[log-mail] to=${input.to} subject=${JSON.stringify(input.subject)} text=${JSON.stringify(input.text)}`,
    );
  }
}

// ─── templates ────────────────────────────────────────────────────────────

function parentalConsentEmailText(input: { studentEmail: string; inviteUrl: string }): string {
  return [
    `Hi,`,
    ``,
    `${input.studentEmail} is signing up for GoMaths, an AI maths tutor for South African Grade 9 learners.`,
    `Because they're under 18, South African law (POPIA + the Children's Act) needs your permission before we can keep their data.`,
    ``,
    `Click the link below to confirm. It expires in 7 days.`,
    ``,
    input.inviteUrl,
    ``,
    `If you didn't expect this email, ignore it — no account will be created.`,
    ``,
    `— GoMaths`,
  ].join("\n");
}

function parentalConsentEmailHtml(input: { studentEmail: string; inviteUrl: string }): string {
  // Deliberately plain. No tracking pixels, no remote images — POPIA
  // hygiene + better deliverability on small SA mail providers.
  return `<!doctype html>
<html><body style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 32px auto; color: #1a1a1a;">
  <h2 style="margin: 0 0 16px;">Please confirm GoMaths for your child</h2>
  <p style="line-height: 1.5;">
    <strong>${escapeHtml(input.studentEmail)}</strong> is signing up for GoMaths,
    an AI maths tutor for South African Grade 9 learners. Because they're under 18,
    South African law (POPIA + the Children's Act) needs your permission before we
    can keep their data.
  </p>
  <p style="margin: 24px 0;">
    <a href="${escapeAttr(input.inviteUrl)}"
       style="display:inline-block;padding:12px 20px;border-radius:12px;background:#0a64ff;color:#fff;text-decoration:none;font-weight:600;">
      Confirm consent
    </a>
  </p>
  <p style="line-height: 1.5; color: #666; font-size: 14px;">
    The link expires in 7 days. If you didn't expect this email, ignore it — no account will be created.
  </p>
  <p style="line-height: 1.5; color: #666; font-size: 12px; margin-top: 32px;">
    — GoMaths
  </p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
