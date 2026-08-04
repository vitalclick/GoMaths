import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/gomaths-logo.png.asset.json";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link to="/" className="flex items-center">
          <img src={logo.url} alt="GoMaths" className="h-7 w-auto" />
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm font-semibold">
          <Link
            to="/privacy"
            className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            Terms
          </Link>
          <Link
            to="/contact"
            className="ml-2 hidden rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-soft transition-colors hover:bg-primary-dark sm:inline-flex"
          >
            Contact
          </Link>

        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <span>© {new Date().getFullYear()} GoMaths</span>
        <nav className="flex flex-wrap gap-5 sm:ml-auto">
          <Link to="/" className="font-semibold transition-colors hover:text-primary">
            Home
          </Link>
          <Link to="/privacy" className="font-semibold transition-colors hover:text-primary">
            Privacy notice
          </Link>
          <Link to="/terms" className="font-semibold transition-colors hover:text-primary">
            Terms of service
          </Link>
          <Link
            to="/contact"
            className="font-semibold transition-colors hover:text-primary"
          >
            Contact
          </Link>

        </nav>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function Callout({
  variant = "note",
  children,
}: {
  variant?: "note" | "todo";
  children: ReactNode;
}) {
  const styles =
    variant === "todo"
      ? "border-note-border bg-note text-note-foreground"
      : "border-primary/30 bg-secondary text-secondary-foreground";
  return (
    <div className={`my-6 rounded-2xl border px-5 py-4 text-[0.95rem] leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}

export function DocTable({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      {children}
    </div>
  );
}

export function DocHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-border bg-card">
      <div className="hero-glow absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-5 pb-12 pt-16">
        <span className="inline-flex rounded-full border border-primary/25 bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-secondary-foreground">
          {eyebrow}
        </span>
        <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
      </div>
    </div>
  );
}
