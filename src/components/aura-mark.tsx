import { cn } from "@/lib/utils";

export function AuraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-8", className)} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" className="fill-surface stroke-border" />
      <circle cx="16" cy="16" r="9" className="stroke-primary" strokeWidth="1.5" opacity="0.45" />
      <circle cx="16" cy="16" r="4.5" className="fill-primary" />
      <path d="M16 3.5v4M16 24.5v4M3.5 16h4M24.5 16h4" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
