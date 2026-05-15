import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ArrowRight, Sparkles, Camera, BookOpen, BarChart3, Users, Palette } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GoMaths — AI-powered mathematics learning" },
      { name: "description", content: "GoMaths design system & key screens. A modern AI-powered maths platform for African learners." },
      { property: "og:title", content: "GoMaths — AI-powered mathematics learning" },
      { property: "og:description", content: "Design system & key screens preview." },
    ],
  }),
  component: Index,
});

const screens = [
  { to: "/design-system", title: "Design System", desc: "Tokens, typography, components, charts.", icon: Palette, tag: "Foundation" },
  { to: "/student/home", title: "Student Home", desc: "Dashboard, streaks, daily goals, recommendations.", icon: Sparkles, tag: "Mobile" },
  { to: "/student/solver", title: "AI Math Solver", desc: "Camera scan + step-by-step explanations.", icon: Camera, tag: "Mobile" },
  { to: "/student/lesson", title: "Lesson", desc: "Topic outline, interactive examples, practice.", icon: BookOpen, tag: "Mobile" },
  { to: "/student/tutor", title: "AI Tutor Chat", desc: "Conversational tutor with suggested prompts.", icon: Sparkles, tag: "Mobile" },
  { to: "/student/progress", title: "Progress", desc: "Mastery, weak areas, achievements.", icon: BarChart3, tag: "Mobile" },
  { to: "/parent", title: "Parent Dashboard", desc: "Child progress, time, weak areas, subscription.", icon: Users, tag: "Web" },
] as const;

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <Link to="/design-system" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Design system →
          </Link>
        </div>
      </header>

      <section className="bg-hero-gradient relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-soft">
            <span className="h-2 w-2 rounded-full bg-primary" /> UI / UX showcase
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            An <span className="text-primary">intelligent</span> maths companion for every African learner.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            GoMaths is a next-generation AI-powered platform for Grade R–12. This preview
            shows the design language, system, and the highest-priority screens of the
            student app and parent dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/student/home" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-95">
              Open student app <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/design-system" className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted">
              Browse design system
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm">
            {[
              ["7", "Key screens"],
              ["40+", "Components"],
              ["Mobile-first", "Built for SA"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
                <div className="font-display text-2xl font-extrabold text-foreground">{n}</div>
                <div className="text-xs text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl font-bold">Screens & system</h2>
        <p className="mt-2 text-muted-foreground">Tap any tile to explore.</p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {screens.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                to={s.to}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-pop"
              >
                <div className="flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.tag}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        GoMaths South Africa · UI/UX prototype · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
