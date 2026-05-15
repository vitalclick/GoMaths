import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Camera, BookOpen, Sparkles, BarChart3 } from "lucide-react";

type Tab = { to: string; label: string; icon: typeof Home; primary?: boolean };
const tabs: Tab[] = [
  { to: "/student/home", label: "Home", icon: Home },
  { to: "/student/lesson", label: "Learn", icon: BookOpen },
  { to: "/student/solver", label: "Solve", icon: Camera, primary: true },
  { to: "/student/tutor", label: "Tutor", icon: Sparkles },
  { to: "/student/progress", label: "Stats", icon: BarChart3 },
];

export function BottomTabs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky bottom-0 z-30 mt-6 border-t border-border bg-card/95 backdrop-blur">
      <ul className="flex items-end justify-around px-2 pb-2 pt-1">
        {tabs.map((t) => {
          const active = path === t.to;
          const Icon = t.icon;
          if (t.primary) {
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-gradient text-accent-foreground shadow-pop"
                  aria-label={t.label}
                >
                  <Icon className="h-6 w-6" />
                </Link>
              </li>
            );
          }
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] font-medium ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
