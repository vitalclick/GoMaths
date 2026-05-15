import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bell, Camera, Check, ChevronLeft, Flame, Search, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { weeklyMinutes, masteryByTopic } from "@/lib/mock-data";

export const Route = createFileRoute("/design-system")({
  head: () => ({
    meta: [
      { title: "Design System — GoMaths" },
      { name: "description", content: "Color, typography, components and charts that power the GoMaths product." },
    ],
  }),
  component: DesignSystem,
});

function Section({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border py-14">
      <div className="mb-8">
        {kicker && <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{kicker}</div>}
        <h2 className="font-display text-3xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, varName, className }: { name: string; varName: string; className: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className={`h-24 ${className}`} />
      <div className="p-3">
        <div className="text-sm font-semibold">{name}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{varName}</div>
      </div>
    </div>
  );
}

function DesignSystem() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back
            </Link>
            <Logo />
          </div>
          <nav className="hidden gap-5 text-sm text-muted-foreground md:flex">
            {[
              ["brand", "Brand"], ["color", "Color"], ["type", "Type"], ["buttons", "Buttons"],
              ["cards", "Cards"], ["forms", "Forms"], ["game", "Gamification"], ["charts", "Charts"], ["icons", "Icons"]
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="hover:text-foreground">{label}</a>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="py-14">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Foundation</div>
          <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight">GoMaths Design System</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A semantic, mobile-first system. All tokens live in <code className="font-mono text-foreground">src/styles.css</code>{" "}
            as oklch CSS variables and surface as Tailwind utility classes.
          </p>
        </div>

        <Section id="brand" kicker="01" title="Brand">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
              <div className="text-xs uppercase text-muted-foreground">Wordmark</div>
              <div className="mt-6 flex flex-col items-start gap-6">
                <Logo className="scale-150 origin-left" />
                <div className="rounded-xl bg-foreground p-6">
                  <Logo />
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-hero-gradient p-8 shadow-soft">
              <div className="text-xs uppercase text-muted-foreground">Voice</div>
              <p className="mt-3 font-display text-2xl font-bold leading-snug">
                Smart, warm, and motivating — never intimidating.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Maths can be intimidating. GoMaths sounds like a confident friend who
                celebrates effort, breaks down complexity, and makes every learner feel capable.
              </p>
            </div>
          </div>
        </Section>

        <Section id="color" kicker="02" title="Color">
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-5">
            <Swatch name="Primary" varName="--primary" className="bg-primary" />
            <Swatch name="Primary Soft" varName="--primary-soft" className="bg-primary-soft" />
            <Swatch name="Accent" varName="--accent" className="bg-accent" />
            <Swatch name="Accent Soft" varName="--accent-soft" className="bg-accent-soft" />
            <Swatch name="Foreground" varName="--foreground" className="bg-foreground" />
            <Swatch name="Background" varName="--background" className="bg-background border border-border" />
            <Swatch name="Muted" varName="--muted" className="bg-muted" />
            <Swatch name="Success" varName="--success" className="bg-success" />
            <Swatch name="Warning" varName="--warning" className="bg-warning" />
            <Swatch name="Info" varName="--info" className="bg-info" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-primary-gradient p-8 text-primary-foreground shadow-pop">
              <div className="text-xs uppercase opacity-80">Gradient · Primary</div>
              <div className="mt-4 font-display text-3xl font-bold">Progress, growth</div>
            </div>
            <div className="rounded-3xl bg-accent-gradient p-8 text-accent-foreground shadow-pop">
              <div className="text-xs uppercase opacity-80">Gradient · Accent</div>
              <div className="mt-4 font-display text-3xl font-bold">Action, energy</div>
            </div>
          </div>
        </Section>

        <Section id="type" kicker="03" title="Typography">
          <div className="space-y-6 rounded-3xl border border-border bg-card p-8 shadow-soft">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Display · Sora</div>
              <div className="mt-2 font-display text-6xl font-extrabold tracking-tight">f(x) = ax² + bx + c</div>
            </div>
            <div className="grid gap-4 border-t border-border pt-6 md:grid-cols-2">
              <div>
                <div className="font-display text-4xl font-bold">H1 · 48</div>
                <div className="font-display text-3xl font-bold">H2 · 36</div>
                <div className="font-display text-2xl font-bold">H3 · 28</div>
                <div className="font-display text-xl font-semibold">H4 · 22</div>
              </div>
              <div className="text-muted-foreground">
                <p className="text-base">
                  Body · Inter. Used for paragraphs, descriptions, and UI copy. Comfortable
                  for long reading on small screens with strong letterspacing.
                </p>
                <p className="mt-3 text-sm">Small · 14px for captions and helper text.</p>
                <p className="mt-3 font-mono text-sm text-foreground">Mono · JetBrains Mono — for math & code: x ≥ -b/2a</p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="buttons" kicker="04" title="Buttons">
          <div className="grid gap-4 rounded-3xl border border-border bg-card p-8 shadow-soft sm:grid-cols-2 md:grid-cols-3">
            <button className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-95">Primary</button>
            <button className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-pop hover:opacity-95">Accent</button>
            <button className="rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted">Secondary</button>
            <button className="rounded-2xl bg-muted px-5 py-3 text-sm font-semibold text-foreground hover:bg-secondary">Ghost</button>
            <button className="rounded-2xl bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground hover:opacity-95">Destructive</button>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-pop">
              <Sparkles className="h-4 w-4" /> Gradient CTA
            </button>
            <button className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-pop"><Camera className="h-5 w-5" /></button>
            <button className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card hover:bg-muted"><Bell className="h-5 w-5" /></button>
            <button className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-pop opacity-60" disabled>Loading…</button>
          </div>
        </Section>

        <Section id="cards" kicker="05" title="Cards">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl bg-primary-gradient p-6 text-primary-foreground shadow-pop">
              <div className="text-xs uppercase opacity-80">Continue learning</div>
              <div className="mt-3 font-display text-xl font-bold">Quadratic Equations</div>
              <div className="mt-1 text-sm opacity-90">6 min left · Chapter 3</div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/30">
                <div className="h-full w-[62%] bg-white" />
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase text-muted-foreground">Daily streak</div>
                <Flame className="h-5 w-5 text-streak" />
              </div>
              <div className="mt-2 font-display text-5xl font-extrabold">17</div>
              <div className="text-sm text-muted-foreground">days in a row</div>
            </div>
            <div className="rounded-3xl border border-border bg-accent-soft p-6 shadow-soft">
              <Trophy className="h-6 w-6 text-accent" />
              <div className="mt-3 font-display text-lg font-bold">Algebra Pro</div>
              <div className="mt-1 text-sm text-muted-foreground">Mastered 10 algebra topics</div>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                <Star className="h-3 w-3" /> +100 XP
              </div>
            </div>
          </div>
        </Section>

        <Section id="forms" kicker="06" title="Forms">
          <div className="space-y-4 rounded-3xl border border-border bg-card p-8 shadow-soft">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="w-full rounded-2xl border border-input bg-background py-3 pl-11 pr-4 text-sm outline-none ring-ring/30 focus:ring-4" placeholder="Search topics, lessons…" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-ring/30" placeholder="Email" />
              <select className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-ring/30">
                <option>Grade 8</option><option>Grade 9</option><option>Grade 10</option>
              </select>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <input key={i} maxLength={1} defaultValue={String(i)} className="h-12 w-12 rounded-xl border border-input bg-background text-center font-display text-xl font-bold focus:ring-4 focus:ring-ring/30" />
              ))}
            </div>
            <label className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
              <span className="text-sm font-medium">Daily reminders at 5pm</span>
              <span className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full bg-primary">
                <span className="absolute right-1 h-4 w-4 rounded-full bg-white shadow" />
              </span>
            </label>
          </div>
        </Section>

        <Section id="game" kicker="07" title="Gamification">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-semibold"><Zap className="h-4 w-4 text-xp" /> XP · Level 12</div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[72%] bg-accent-gradient" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>2,480 XP</span><span>520 to level 13</span></div>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="text-sm font-semibold">Badges</div>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {["🔥","⚡","🧮","📐","🎯","🏆","🌙","⭐"].map((e, i) => (
                  <div key={i} className={`grid aspect-square place-items-center rounded-2xl text-xl ${i < 5 ? "bg-primary-soft" : "bg-muted opacity-50"}`}>{e}</div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="text-sm font-semibold">Leaderboard</div>
              <ul className="mt-3 space-y-2">
                {[["🦁","Sipho M.","3,120"],["🦒","Naledi K.","2,980"],["🦊","You","2,480"]].map(([a,n,xp], i) => (
                  <li key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${i===2 ? "bg-primary-soft font-semibold" : "bg-muted/50"}`}>
                    <span className="flex items-center gap-2"><span className="text-base">{a}</span>{n}</span>
                    <span className="font-mono text-xs">{xp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="charts" kicker="08" title="Charts">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="text-sm font-semibold">Weekly study minutes</div>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyMinutes}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                    <Bar dataKey="min" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="text-sm font-semibold">Mastery by topic</div>
              <div className="mt-4 space-y-3">
                {masteryByTopic.map((t) => (
                  <div key={t.topic}>
                    <div className="flex justify-between text-xs"><span className="font-medium">{t.topic}</span><span className="text-muted-foreground">{t.mastery}%</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${t.mastery}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section id="icons" kicker="09" title="Iconography">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
              {[Camera, Sparkles, Bell, Search, Star, Trophy, Flame, Zap, Check, ChevronLeft].map((I, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted"><I className="h-5 w-5" /></div>
                  <span className="text-[10px] text-muted-foreground">{I.displayName}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Lucide React. 1.5 stroke. Always paired with a touch target ≥ 44px.</p>
          </div>
        </Section>
      </div>
    </main>
  );
}
