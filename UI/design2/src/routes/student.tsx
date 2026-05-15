import { createFileRoute, Link } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});

function StudentLayout() {
  return (
    <div className="min-h-screen bg-hero-gradient">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <Logo />
          <Link to="/design-system" className="text-sm text-muted-foreground hover:text-foreground">System</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <PhoneFrame>
          <Outlet />
        </PhoneFrame>
      </div>
    </div>
  );
}
