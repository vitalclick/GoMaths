import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BottomTabs } from "@/components/BottomTabs";
import { solverSteps } from "@/lib/mock-data";
import { Image as ImageIcon, Mic, Sparkles, Volume2, X, Zap } from "lucide-react";

export const Route = createFileRoute("/student/solver")({
  component: Solver,
});

function Solver() {
  return (
    <div className="flex min-h-full flex-col bg-foreground text-background">
      {/* Camera viewfinder mock */}
      <div className="relative h-72 overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="absolute inset-x-0 top-12 flex items-center justify-between px-5">
          <button aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><X className="h-5 w-5" /></button>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Math Solver</div>
          <button aria-label="Gallery" className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><ImageIcon className="h-5 w-5" /></button>
        </div>

        {/* Detected equation overlay */}
        <div className="absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-primary bg-background/10 px-6 py-4 backdrop-blur-sm">
          <div className="font-mono text-2xl font-bold text-background">x² + 5x + 6 = 0</div>
          <motion.div
            className="absolute inset-x-0 h-0.5 bg-primary"
            initial={{ top: 0 }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* corners */}
        {["top-20 left-5", "top-20 right-5", "bottom-5 left-5", "bottom-5 right-5"].map((p, i) => (
          <div key={i} className={`absolute h-6 w-6 border-primary ${p} ${
            i === 0 ? "border-l-2 border-t-2" : i === 1 ? "border-r-2 border-t-2" : i === 2 ? "border-b-2 border-l-2" : "border-b-2 border-r-2"
          }`} />
        ))}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold">Equation detected</div>
        </div>
      </div>

      {/* Solution sheet */}
      <div className="flex-1 rounded-t-3xl bg-background px-5 pb-8 pt-5 text-foreground">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-primary">Solution</div>
            <div className="font-display text-xl font-bold">Solve for x</div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-xp/15 px-3 py-1 text-xs font-semibold text-xp">
            <Zap className="h-3 w-3" /> +25 XP
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">Step-by-step</button>
          <button className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">Explain like I'm 10</button>
          <button aria-label="Listen" className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-muted"><Volume2 className="h-4 w-4" /></button>
        </div>

        <ol className="mt-5 space-y-3">
          {solverSteps.map((s, i) => (
            <li key={i} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</div>
                <div className="text-sm font-semibold">{s.step}</div>
              </div>
              <div className="mt-2 rounded-xl bg-muted px-3 py-2 font-mono text-sm">{s.math}</div>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-2xl bg-accent-soft p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-accent">
            <Sparkles className="h-4 w-4" /> Final answer
          </div>
          <div className="mt-2 font-mono text-lg font-bold">x = -2  or  x = -3</div>
        </div>

        <div className="mt-5 flex gap-2">
          <button className="flex-1 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-pop">Practice similar</button>
          <button aria-label="Voice" className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-pop"><Mic className="h-5 w-5" /></button>
        </div>
      </div>

      <BottomTabs />
    </div>
  );
}
