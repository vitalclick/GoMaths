import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteLayout, DocHeader, Callout } from "@/components/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — GoMaths" },
      {
        name: "description",
        content: "The terms on which you may use the GoMaths maths practice app.",
      },
      { property: "og:title", content: "Terms of service — GoMaths" },
      {
        property: "og:description",
        content: "The terms on which you may use the GoMaths maths practice app.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <DocHeader
        eyebrow="Last updated: to be set on publication"
        title="Terms of service"
        intro="These terms are an agreement between you and GoMaths. By creating an account or using the app, you accept them. If you do not accept them, please do not use GoMaths."
      />

      <div className="prose-doc mx-auto max-w-3xl px-5 py-14">
        <Callout variant="todo">
          <strong>Draft for review, not legal advice.</strong> These terms are written to match how
          GoMaths actually behaves, but a South African attorney should review them before
          publication — particularly the liability, consumer-protection and minors provisions. The
          Consumer Protection Act limits how far some of these clauses can go.
        </Callout>

        <h2>1. Who we are</h2>
        <Callout variant="todo">
          Fill in the registered entity name, registration number and address.
        </Callout>
        <p>
          GoMaths is operated by <em>[registered entity name and registration number]</em>, of{" "}
          <em>[registered address]</em> (“we”, “us”).
        </p>

        <h2>2. Who may use GoMaths</h2>
        <ul>
          <li>
            You may create an account if you are 18 or older, or if you are under 18 and a parent or
            guardian has given permission through our consent process.
          </li>
          <li>
            If you are under 18, your parent or guardian accepts these terms on your behalf and is
            responsible for your use of the app.
          </li>
          <li>
            Your account is yours alone. Do not share your password or let someone else use your
            account.
          </li>
          <li>You must give us accurate information when you sign up.</li>
        </ul>

        <h2>3. What GoMaths is — and is not</h2>
        <Callout>
          <strong>The AI features can be wrong.</strong> Maya, the AI tutor, and the photo problem
          scanner generate answers automatically. They can misread a problem, make a mistake in
          working, or give an explanation that does not match what your teacher expects. Always
          check important work yourself.
        </Callout>
        <p>
          GoMaths is a practice and revision aid. It is not a substitute for school, a teacher, or
          formal tuition, and we do not guarantee any particular academic result. Our lesson content
          is aligned to the CAPS curriculum as a guide; the Department of Basic Education is the
          authority on the curriculum itself, and on what is examinable.
        </p>

        <h2>4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>use GoMaths for anything unlawful, or to harass or harm anyone;</li>
          <li>
            upload content that is abusive, hateful, sexual, or that contains someone else's
            personal information;
          </li>
          <li>
            try to break, overload, reverse-engineer or gain unauthorised access to the service or
            other users' accounts;
          </li>
          <li>
            use automated means to scrape or bulk-download our content, or resell any part of the
            service;
          </li>
          <li>
            misuse the AI features — for example to generate content unrelated to learning maths.
          </li>
        </ul>
        <p>
          We may suspend or close an account that breaches these terms. Where we reasonably can, we
          will tell you why first.
        </p>

        <h2>5. Content and ownership</h2>
        <p>
          The GoMaths app, its lesson text, question banks, worked solutions, branding and software
          belong to us or our licensors, and are protected by copyright. You may use them for your
          own learning. You may not copy, redistribute or sell them.
        </p>
        <p>
          What you put into GoMaths — your questions to the tutor, the photos you scan, your answers
          — stays yours. You give us permission to process it for the purpose of running the
          service, as described in our <Link to="/privacy">privacy notice</Link>.
        </p>

        <h2>6. Your privacy</h2>
        <p>
          How we handle personal information is set out in our{" "}
          <Link to="/privacy">privacy notice</Link>, which forms part of these terms. It matters
          particularly if you are under 18 — please read it with your parent or guardian.
        </p>

        <h2>7. Availability</h2>
        <p>
          We work to keep GoMaths available, but we cannot promise it will never be interrupted. We
          may change, suspend or withdraw features, and we may take the service down for
          maintenance. Where a change is significant, we will give reasonable notice.
        </p>

        <h2>8. Cost</h2>
        <Callout variant="todo">
          Replace this section with your actual commercial terms once pricing exists: what is free,
          what is paid, billing cycle, renewal, refunds, and cancellation. If GoMaths is free for
          now, say so plainly and say that paid features will be introduced with notice.
        </Callout>

        <h2>9. Ending your use</h2>
        <p>
          You may stop using GoMaths at any time and ask us to delete your account by emailing{" "}
          <a href="mailto:privacy@gomaths.co.za">privacy@gomaths.co.za</a>. A parent or guardian may
          do the same for a learner under 18, including by withdrawing consent. We may close an
          account that seriously or repeatedly breaches these terms.
        </p>

        <h2>10. Liability</h2>
        <Callout variant="todo">
          Have this clause drafted or checked by an attorney. South African consumer law limits how
          far liability may be excluded, and an over-broad exclusion may be unenforceable — which is
          worse than a narrower one that holds.
        </Callout>
        <p>
          GoMaths is provided as it is. To the extent the law allows, we are not liable for indirect
          or consequential loss, or for loss arising from your reliance on an answer the AI features
          produced. Nothing in these terms limits liability that cannot lawfully be limited.
        </p>

        <h2>11. Changes to these terms</h2>
        <p>
          We may update these terms. We will change the date at the top, and for significant changes
          we will notify you in the app or by email. Continuing to use GoMaths after a change means
          you accept the updated terms.
        </p>

        <h2>12. Governing law</h2>
        <p>
          These terms are governed by the law of the Republic of South Africa, and the South African
          courts have jurisdiction.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a href="mailto:support@gomaths.co.za">support@gomaths.co.za</a>
        </p>
      </div>
    </SiteLayout>
  );
}
