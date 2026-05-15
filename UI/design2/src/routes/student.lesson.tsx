import { createFileRoute } from "@tanstack/react-router";
import { BottomTabs } from "@/components/BottomTabs";
import { lessonOutline } from "@/lib/mock-data";
import { Check, ChevronLeft, Lock, Play } from "lucide-react";

export const Route = createFileRoute("/student/lesson")({
  component: Lesson,
});

function Parabola() {
  // y = x² + 5x + 6 — roots at -2 and -3
  const w = 320, h = 160, pad = 16;
  const xs = Array.from({ length: 81 }, (_, i) => -6 + i * 0.1);
  const points = xs.map((x) => {
    const y = x * x + 5 * x + 6;
    const px = pad + ((x + 6) / 8) * (w - pad * 2);
    const py = h - pad - ((y + 1) / 14) * (h - pad * 2);
    return `${px},${Math.max(0, Math.min(h, py))}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill="url(#grid)" />
      <line x1={pad} y1={h - pad - (1 / 14) * (h - pad * 2)} x2={w - pad} y2={h - pad - (1 / 14) * (h - pad * 2)} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      {[-3, -2].map((rx) => {
        const px = pad + ((rx + 6) / 8) * (w - pad * 2);
        const py = h - pad - ((1) / 14) * (h - pad * 2);
        return <circle key={rx} cx={px} cy={py} r="5" fill="var(--accent)" stroke="var(--background)" strokeWidth="2" />;
      })}
    </svg>
  );
}

function Lesson() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-primary-soft px-5 pb-6 pt-12">
        <div className="flex items-center justify-between">
          <button aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft"><ChevronLeft className="h-5 w-5" /></button>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Algebra · Chapter 3</div>
          <div className="w-10" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Quadratic Equations</h1>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative grid h-14 w-14 place-items-center rounded-full bg-card shadow-soft">
            <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--muted)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray={`${0.6 * 94.25} 94.25`} strokeLinecap="round" />
            </svg>
            <span className="font-display text-sm font-extrabold">60%</span>
          </div>
          <div>
            <div className="font-display text-sm font-bold">Mastery</div>
            <div className="text-xs text-muted-foreground">3 of 6 lessons complete</div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 px-5 py-5">
        {/* Outline */}
        <div>
          <h2 className="mb-2 font-display text-sm font-bold">Lessons</h2>
          <ul className="space-y-2">
            {lessonOutline.map((l) => (
              <li key={l.id} className={`flex items-center gap-3 rounded-2xl border border-border p-3 ${
                l.current ? "bg-primary-soft" : "bg-card"
              }`}>
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${
                  l.done ? "bg-primary text-primary-foreground" : l.current ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {l.done ? <Check className="h-4 w-4" /> : l.current ? <Play className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{l.title}</div>
                  <div className="text-[11px] text-muted-foreground">{l.duration} min</div>
                </div>
                {l.current && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">NOW</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Interactive example */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase text-primary">Visual example</div>
          <div className="mt-1 font-display text-base font-bold">y = x² + 5x + 6</div>
          <div className="mt-3 overflow-hidden rounded-xl bg-background">
            <Parabola />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Roots: <span className="font-mono text-accent">x = -3, -2</span></span>
            <span>Vertex: <span className="font-mono">(-2.5, -0.25)</span></span>
          </div>
        </div>

        {/* Try it */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase text-accent">Try it</div>
          <div className="mt-1 font-display text-base font-bold">Factorise x² + 7x + 12</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["(x+3)(x+4)", "(x+2)(x+6)", "(x+1)(x+12)", "(x-3)(x-4)"].map((opt, i) => (
              <button key={i} className={`rounded-xl border-2 px-3 py-3 text-left font-mono text-sm transition ${
                i === 0 ? "border-primary bg-primary-soft" : "border-border bg-background hover:border-primary/50"
              }`}>
                {opt}
              </button>
            ))}
          </div>
          <button className="mt-3 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-pop">Check answer</button>
        </div>
      </div>

      <BottomTabs />
    </div>
  );
}
