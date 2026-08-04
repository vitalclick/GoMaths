import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site";
import logo from "@/assets/gomaths-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GoMaths — your maths buddy" },
      {
        name: "description",
        content:
          "CAPS-aligned maths practice for South African learners: lessons, practice questions, an AI tutor and a photo problem solver.",
      },
      { property: "og:title", content: "GoMaths — your maths buddy" },
      {
        property: "og:description",
        content:
          "CAPS-aligned maths practice for South African learners: lessons, practice, an AI tutor and a photo solver.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  {
    title: "Lessons that follow CAPS",
    body: "Topics mapped to the national curriculum, so what you practise is what you're taught.",
    tag: "01",
  },
  {
    title: "Practice questions",
    body: "Worked solutions step by step, with the mistakes people usually make called out.",
    tag: "02",
  },
  {
    title: "Maya, the AI tutor",
    body: "Ask a question in your own words and get a nudge rather than just the answer.",
    tag: "03",
  },
  {
    title: "Scan a problem",
    body: "Photograph a maths problem and get a step-by-step route to the answer.",
    tag: "04",
  },
  {
    title: "Progress and streaks",
    body: "Daily goals, XP and mastery per topic, so progress is visible.",
    tag: "05",
  },
  {
    title: "Built for South Africa",
    body: "POPIA-aware by design, with parental consent required for learners under 18.",
    tag: "06",
  },
];

function Index() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-paper absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="hero-glow absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 text-center sm:pt-28">
          <img src={logo.url} alt="GoMaths" className="mx-auto h-12 w-auto sm:h-14" />
          <h1 className="mx-auto mt-8 max-w-3xl text-5xl font-extrabold leading-[1.05] sm:text-7xl">
            Your <span className="brand-gradient-text">maths buddy</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            GoMaths helps South African learners practise maths a little every day — and keep the
            streak alive.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:support@gomaths.co.za"
              className="rounded-full bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground shadow-lift transition-colors hover:bg-primary-dark"
            >
              Get in touch
            </a>
          </div>
          <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4">
            {[
              ["CAPS", "aligned content"],
              ["Grades 4–12", "coverage"],
              ["POPIA", "aware by design"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="rounded-2xl border border-border bg-card/70 px-3 py-4 backdrop-blur"
              >
                <dt className="text-lg font-extrabold text-primary sm:text-xl">{k}</dt>
                <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="max-w-lg text-3xl font-extrabold sm:text-4xl">
          Everything a learner needs, in one app
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="group rounded-3xl border border-border bg-card p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-sm font-extrabold text-secondary-foreground">
                {f.tag}
              </span>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-ink-foreground sm:px-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Learners under 18</h2>
            <p className="mt-5 leading-relaxed opacity-80">
              South African law (POPIA and the Children's Act) requires a parent or guardian to give
              permission before we may keep a child's personal information. When someone under 18
              signs up, GoMaths emails their parent or guardian a confirmation link, and the account
              is only created once that link is clicked.
            </p>
            <Link
              to="/privacy"
              className="mt-7 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-dark"
            >
              Read the privacy notice
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Get in touch</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href="mailto:support@gomaths.co.za"
            className="rounded-3xl border border-border bg-card p-6 shadow-soft transition-colors hover:border-primary/40"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Support
            </p>
            <p className="mt-2 text-lg font-bold text-primary">support@gomaths.co.za</p>
          </a>
          <a
            href="mailto:privacy@gomaths.co.za"
            className="rounded-3xl border border-border bg-card p-6 shadow-soft transition-colors hover:border-primary/40"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Privacy and data requests
            </p>
            <p className="mt-2 text-lg font-bold text-primary">privacy@gomaths.co.za</p>
          </a>
        </div>
      </section>
    </SiteLayout>
  );
}
