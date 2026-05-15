export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-primary-gradient text-primary-foreground shadow-pop">
        <span className="font-display text-lg font-extrabold leading-none">G</span>
        <span className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-accent" />
      </div>
      <span className="font-display text-xl font-extrabold tracking-tight">
        Go<span className="text-primary">Maths</span>
      </span>
    </div>
  );
}
