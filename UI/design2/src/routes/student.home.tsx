import { createFileRoute } from "@tanstack/react-router";
import { BottomTabs } from "@/components/BottomTabs";
import { student, continueLesson, recommended, dailyChallenge } from "@/lib/mock-data";
import { Bell, Flame, Play, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/student/home")({
  component: StudentHome,
});

function StudentHome() {
  const goalPct = (student.dailyGoal.done / student.dailyGoal.target) * 100;
  const xpPct = (student.xp / student.nextLevelXp) * 100;

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-primary-gradient px-5 pb-8 pt-12 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl">{student.avatar}</div>
            <div>
              <div className="text-xs opacity-80">Hi there 👋</div>
              <div className="font-display text-lg font-bold">{student.name}, Grade {student.grade}</div>
            </div>
          </div>
          <button aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
            <Bell className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/15 p-3 text-center">
            <Flame className="mx-auto h-4 w-4" />
            <div className="mt-1 font-display text-xl font-extrabold">{student.streak}</div>
            <div className="text-[10px] opacity-80">streak</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-center">
            <Zap className="mx-auto h-4 w-4" />
            <div className="mt-1 font-display text-xl font-extrabold">{student.xp.toLocaleString()}</div>
            <div className="text-[10px] opacity-80">XP · L{student.level}</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-center">
            <span className="text-base">🪙</span>
            <div className="mt-1 font-display text-xl font-extrabold">{student.coins}</div>
            <div className="text-[10px] opacity-80">coins</div>
          </div>
        </div>
      </div>

      <div className="-mt-5 flex-1 space-y-5 rounded-t-3xl bg-background px-5 pb-8 pt-5">
        {/* Daily goal */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Daily goal</div>
              <div className="font-display text-lg font-bold">{student.dailyGoal.done} / {student.dailyGoal.target} XP</div>
            </div>
            <div className="text-xs font-semibold text-primary">{Math.round(goalPct)}%</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary-gradient" style={{ width: `${goalPct}%` }} />
          </div>
        </div>

        {/* Continue */}
        <div>
          <h2 className="mb-2 font-display text-base font-bold">Pick up where you left off</h2>
          <div className="rounded-2xl bg-foreground p-5 text-background shadow-pop">
            <div className="text-xs opacity-70">{continueLesson.chapter}</div>
            <div className="mt-1 font-display text-xl font-bold">{continueLesson.topic}</div>
            <div className="mt-1 text-xs opacity-70">{continueLesson.minutesLeft} min left</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-primary" style={{ width: `${continueLesson.progress * 100}%` }} />
            </div>
            <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
              <Play className="h-4 w-4" /> Continue
            </button>
          </div>
        </div>

        {/* AI tutor */}
        <button className="flex w-full items-center justify-between rounded-2xl bg-accent-gradient p-4 text-left text-accent-foreground shadow-pop">
          <div>
            <div className="text-xs opacity-90">AI Tutor</div>
            <div className="font-display text-base font-bold">Stuck on something? Ask me.</div>
          </div>
          <Sparkles className="h-6 w-6" />
        </button>

        {/* Recommended */}
        <div>
          <h2 className="mb-2 font-display text-base font-bold">Recommended for you</h2>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
            {recommended.map((l) => (
              <div key={l.id} className="w-44 shrink-0 rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="text-2xl">{l.emoji}</div>
                <div className="mt-2 text-[10px] uppercase text-muted-foreground">{l.topic}</div>
                <div className="mt-1 font-display text-sm font-bold leading-tight">{l.title}</div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{l.duration} min</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-xp"><Zap className="h-3 w-3" /> {l.xp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily challenge */}
        <div>
          <h2 className="mb-2 font-display text-base font-bold">Daily challenge</h2>
          <div className="rounded-2xl border-2 border-dashed border-accent bg-accent-soft p-4">
            <div className="flex items-start justify-between">
              <div className="font-display text-sm font-bold">{dailyChallenge.title}</div>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">+{dailyChallenge.reward} XP</span>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: dailyChallenge.total }).map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i < dailyChallenge.progress ? "bg-accent" : "bg-accent/20"}`} />
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{dailyChallenge.progress} of {dailyChallenge.total} solved</div>
          </div>
        </div>
      </div>

      <BottomTabs />
    </div>
  );
}
