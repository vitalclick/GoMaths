import { ReactNode } from "react";

export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[400px] ${className}`}>
      <div className="relative rounded-[2.5rem] border-[10px] border-foreground/90 bg-background shadow-pop overflow-hidden">
        <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
        <div className="relative h-[760px] overflow-y-auto bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}
