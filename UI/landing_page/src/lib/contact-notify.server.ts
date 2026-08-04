// Sends the internal notification email for a new contact form submission.
// Wired up once the project's sender domain is configured; until then it logs
// the submission without failing the user's request.
type ContactPayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export async function notifyContactMessage(payload: ContactPayload) {
  try {
    console.info("[contact] new message", {
      name: payload.name,
      email: payload.email,
      subject: payload.subject ?? "",
    });
  } catch (error) {
    // Never fail the user's submission because notification delivery hiccupped.
    console.error("[contact] notification failed", error);
  }
}
