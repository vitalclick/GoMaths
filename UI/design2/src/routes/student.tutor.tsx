import { createFileRoute } from "@tanstack/react-router";
import { BottomTabs } from "@/components/BottomTabs";
import { tutorChat, tutorPrompts } from "@/lib/mock-data";
import { ChevronLeft, Mic, Send, Sparkles } from "lucide-react";

export const Route = createFileRoute("/student/tutor")({
  component: Tutor,
});

function bold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
  );
}

function Tutor() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-border bg-background px-5 pb-3 pt-12">
        <div className="flex items-center gap-3">
          <button aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full bg-muted"><ChevronLeft className="h-5 w-5" /></button>
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent-gradient text-accent-foreground"><Sparkles className="h-5 w-5" /></div>
          <div>
            <div className="font-display text-base font-bold">Maya · AI Tutor</div>
            <div className="flex items-center gap-1 text-[11px] text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Always online
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/40 px-4 py-4">
        {tutorChat.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-soft ${
              m.role === "user"
                ? "rounded-br-sm bg-primary text-primary-foreground"
                : "rounded-bl-sm bg-card text-foreground"
            }`}>
              {bold(m.text)}
            </div>
          </div>
        ))}

        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-soft">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.15s" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background px-4 py-3">
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {tutorPrompts.map((p) => (
            <button key={p} className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card pl-4 pr-1 shadow-soft">
          <input className="flex-1 bg-transparent py-3 text-sm outline-none" placeholder="Ask Maya anything…" />
          <button aria-label="Voice" className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground"><Mic className="h-4 w-4" /></button>
          <button aria-label="Send" className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button>
        </div>
      </div>

      <BottomTabs />
    </div>
  );
}
