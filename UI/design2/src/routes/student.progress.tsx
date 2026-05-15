import { createFileRoute } from "@tanstack/react-router";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BottomTabs } from "@/components/BottomTabs";
import { achievements, masteryByTopic, masteryTrend, weakAreas } from "@/lib/mock-data";
import { ArrowRight, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/student/progress")({
  component: Progress,
});

function Progress() {
  const overall = Math.round(masteryByTopic.reduce((a, t) => a + t.mastery, 0) / masteryByTopic.length);
  return (
    <div className="flex min-h-full flex-col">
      <div className="px-5 pb-5 pt-12">
        <div className="flex items-center justify-between">
          <button aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full bg-muted"><ChevronLeft className="h-5 w-5" /></button>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your progress</div>
          <div className="w-10" />
        </div>

        <div className="mt-5 flex items-center gap-4 rounded-3xl bg-primary-gradient p-5 text-primary-foreground shadow-pop">
          <div className="relative grid h-20 w-20 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="white" strokeWidth="4" strokeDasharray={`${(overall / 100) * 94.25} 94.25`} strokeLinecap="round" />
            </svg>
            <div className="font-display text-xl font-extrabold">{overall}%</div>
          </div>
          <div>
            <div className="text-xs opacity-80">Overall mastery</div>
            <div className="font-display text-lg font-bold">You're doing great, Lerato!</div>
            <div className="mt-1 text-xs opacity-90">+8% this week</div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 px-5 pb-6">
        {/* Trend */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="text-sm font-semibold">Mastery trend</div>
          <div className="text-xs text-muted-foreground">Last 6 weeks</div>
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={masteryTrend}>
                <XAxis dataKey="week" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topics */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="text-sm font-semibold">By topic</div>
          <div className="mt-3 space-y-3">
            {masteryByTopic.map((t) => (
              <div key={t.topic}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{t.topic}</span>
                  <span className="text-muted-foreground">{t.mastery}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${t.mastery < 50 ? "bg-accent" : "bg-primary"}`} style={{ width: `${t.mastery}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak areas */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="text-sm font-semibold">Focus areas</div>
          <div className="mt-3 space-y-2">
            {weakAreas.map((w) => (
              <button key={w.topic} className="flex w-full items-center justify-between rounded-xl bg-accent-soft p-3 text-left">
                <div>
                  <div className="text-sm font-semibold">{w.topic}</div>
                  <div className="text-[11px] text-muted-foreground">{w.lessons} lessons recommended · {w.score}% mastery</div>
                </div>
                <ArrowRight className="h-4 w-4 text-accent" />
              </button>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="text-sm font-semibold">Achievements</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {achievements.map((a) => (
              <div key={a.id} className={`rounded-2xl p-3 text-center ${a.earned ? "bg-primary-soft" : "bg-muted opacity-60"}`}>
                <div className="text-2xl">{a.emoji}</div>
                <div className="mt-1 text-[11px] font-bold">{a.name}</div>
                <div className="text-[10px] text-muted-foreground">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomTabs />
    </div>
  );
}
