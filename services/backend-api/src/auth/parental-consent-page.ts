/**
 * HTML landing page rendered for GET /auth/parental-consent/confirm.
 *
 * There's no separate public web app deployed yet to host this page (see
 * docs/TASK_LIST.md), so the API renders it directly at the link mailed to
 * the parent — a plain GET click from an email client, which is why this
 * exists as a page rather than only the JSON POST endpoint the student app
 * uses for its own polling flow.
 */
export function renderConsentPage(input: {
  ok: boolean;
  heading: string;
  message: string;
}): string {
  const { ok, heading, message } = input;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GoMaths — Parental consent</title>
</head>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 64px auto; padding: 0 24px; color: #1a1a1a; text-align: center;">
  <div style="font-size: 40px; margin-bottom: 16px;">${ok ? "&#9989;" : "&#9888;&#65039;"}</div>
  <h1 style="font-size: 22px; margin: 0 0 12px;">${escapeHtml(heading)}</h1>
  <p style="line-height: 1.5; color: #444;">${escapeHtml(message)}</p>
  <p style="line-height: 1.5; color: #999; font-size: 12px; margin-top: 40px;">— GoMaths</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
