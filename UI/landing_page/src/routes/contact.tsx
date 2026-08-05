import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, DocHeader } from "@/components/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact GoMaths — questions, support and feedback" },
      {
        name: "description",
        content:
          "Get in touch with the GoMaths team about lessons, accounts, parental consent or feedback. We reply within two working days.",
      },
      { property: "og:title", content: "Contact GoMaths" },
      {
        property: "og:description",
        content: "Questions about GoMaths? Send us a message and we'll get back to you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Posts to public/contact.php rather than a TanStack server function.
 * The site is prerendered to static HTML on cPanel, where no server
 * function exists — PHP is what that host actually runs. The endpoint
 * re-validates everything; the checks here are only for fast feedback.
 */
const CONTACT_ENDPOINT = "/contact.php";

function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          subject: String(formData.get("subject") ?? ""),
          message: String(formData.get("message") ?? ""),
          // Honeypot — hidden from people, filled in by naive bots.
          company: String(formData.get("company") ?? ""),
        }),
      });

      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !body?.ok) {
        throw new Error(body?.message ?? "Something went wrong. Please try again.");
      }

      form.reset();
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <SiteLayout>
      <DocHeader
        eyebrow="Contact"
        title="Talk to the GoMaths team"
        intro="Questions about lessons, your account or parental consent? Send us a message and we'll reply within two working days."
      />

      <div className="mx-auto grid max-w-3xl gap-8 px-5 py-12">
        <form
          onSubmit={handleSubmit}
          className="relative rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your name" htmlFor="name">
              <input
                id="name"
                name="name"
                required
                maxLength={100}
                autoComplete="name"
                className={inputClass}
                placeholder="Thandi Nkosi"
              />
            </Field>
            <Field label="Email address" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={255}
                autoComplete="email"
                className={inputClass}
                placeholder="you@example.com"
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Subject" htmlFor="subject" optional>
              <input
                id="subject"
                name="subject"
                maxLength={150}
                className={inputClass}
                placeholder="Grade 10 practice questions"
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Message" htmlFor="message">
              <textarea
                id="message"
                name="message"
                required
                minLength={10}
                maxLength={2000}
                rows={6}
                className={`${inputClass} resize-y`}
                placeholder="Tell us what you need help with…"
              />
            </Field>
          </div>

          {/*
            Honeypot. Hidden from people and from screen readers, but a bot
            filling every input will complete it — contact.php then returns
            200 without sending, so the bot cannot tell it was caught.
          */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="company">Company (leave blank)</label>
            <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
            <p className="text-sm text-muted-foreground">
              Or email{" "}
              <a className="font-semibold text-primary" href="mailto:support@gomaths.co.za">
                support@gomaths.co.za
              </a>
            </p>
          </div>

          {status === "sent" && (
            <p
              role="status"
              className="mt-5 rounded-2xl border border-primary/30 bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground"
            >
              Thanks — your message is in. We'll be in touch soon.
            </p>
          )}
          {status === "error" && error && (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
            >
              {error}
            </p>
          )}
        </form>
      </div>
    </SiteLayout>
  );
}

const inputClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-bold text-foreground"
      >
        {label}
        {optional && <span className="ml-1 font-medium text-muted-foreground">(optional)</span>}
      </label>
      {children}
    </div>
  );
}
