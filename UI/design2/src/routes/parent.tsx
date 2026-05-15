import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Logo } from "@/components/Logo";
import { children, parentSummary, recentActivity, weakAreas, weeklyMinutes } from "@/lib/mock-data";
import { Bell, ChevronLeft, Clock, CreditCard, Settings, Target, TrendingUp, Trophy } from "lucide-react";

export const Route = createFileRoute("/parent")({
  head: () => ({
    meta: [
      { title: "Parent Dashboard — GoMaths" },
      { name: "description", content: "Monitor your child's maths progress, time spent, and weak areas." },
    ],
  }),
  component: Parent,
});

function Parent() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back
            </Link>
            <Logo />
            <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Parent</span>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-full bg-muted"><Bell className="h-5 w-5" /></button>
            <button aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-full bg-muted"><Settings className="h-5 w-5" /></button>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-gradient text-primary-foreground font-bold">N</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* Greeting + child selector */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold">Welcome back, Naledi</h1>
            <p className="text-sm text-muted-foreground">Here's how your children are doing this week.</p>
          </div>
          <div className="flex gap-2 rounded-2xl border border-border bg-card p-1 shadow-soft">
            {children.map((c) => (
              <button key={c.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                c.active ? "bg-primary text-primary-foreground shadow-pop" : "text-muted-foreground hover:bg-muted"
              }`}>
                <span>{c.avatar}</span>
                {c.name}
                <span className={`text-[10px] ${c.active ? "opacity-80" : ""}`}>· G{c.grade}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock, label: "Time learning", value: `${parentSummary.weeklyMinutes}m`, sub: "this week", tint: "bg-primary-soft text-primary" },
            { icon: Target, label: "Weekly goal", value: `${parentSummary.weeklyGoalPct}%`, sub: "completed", tint: "bg-accent-soft text-accent" },
            { icon: TrendingUp, label: "Lessons done", value: parentSummary.lessonsCompleted, sub: "↑ 4 vs last week", tint: "bg-info/15 text-info" },
            { icon: Trophy, label: "Topics mastered", value: parentSummary.topicsMastered, sub: "this month", tint: "bg-xp/15 text-xp" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <div className={`grid h-10 w-10 place-items-center rounded-2xl ${s.tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-display text-3xl font-extrabold">{s.value}</div>
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Time chart */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Daily learning time</div>
                <div className="text-xs text-muted-foreground">Last 7 days · minutes</div>
              </div>
              <div className="text-xs text-muted-foreground">Total <span className="font-bold text-foreground">240m</span></div>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyMinutes}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="min" stroke="var(--primary)" strokeWidth={3} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subscription */}
          <div className="rounded-3xl bg-foreground p-6 text-background shadow-pop">
            <div className="text-xs uppercase opacity-70">Subscription</div>
            <div className="mt-2 font-display text-2xl font-extrabold">GoMaths Family</div>
            <div className="mt-1 text-sm opacity-80">2 children · Renews 12 Jun</div>
            <div className="mt-5 rounded-2xl bg-white/10 p-4">
              <div className="flex justify-between text-xs opacity-80"><span>Monthly</span><span>R 199</span></div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-2/3 bg-primary" />
              </div>
              <div className="mt-2 text-[11px] opacity-70">21 days left in cycle</div>
            </div>
            <button className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-pop">
              <CreditCard className="h-4 w-4" /> Manage plan
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activity */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="text-sm font-semibold">Recent activity</div>
            <ul className="mt-4 space-y-3">
              {recentActivity.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="text-sm font-medium">{a.text}</div>
                    <div className="text-xs text-muted-foreground">{a.time}</div>
                  </div>
                  {a.xp > 0 && <span className="rounded-full bg-xp/15 px-2 py-0.5 text-xs font-semibold text-xp">+{a.xp} XP</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Focus areas */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Where Lerato needs help</div>
              <span className="text-xs text-muted-foreground">AI insights</span>
            </div>
            <ul className="mt-4 space-y-2">
              {weakAreas.map((w) => (
                <li key={w.topic} className="flex items-center justify-between rounded-2xl bg-accent-soft p-3">
                  <div>
                    <div className="text-sm font-semibold">{w.topic}</div>
                    <div className="text-[11px] text-muted-foreground">{w.score}% mastery · {w.lessons} suggested lessons</div>
                  </div>
                  <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground">Action</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-2xl bg-primary-soft p-3 text-xs text-primary">
              💡 Recommended: 15 minutes of trig practice 3× a week could lift mastery to 70% by month-end.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
