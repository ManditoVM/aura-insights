import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "critical" | "success";
  icon?: ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p
        className={cn(
          "text-numeric mt-3 text-2xl font-semibold",
          tone === "warning" && "text-warning",
          tone === "critical" && "text-destructive",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-display text-sm font-semibold">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function SeverityDot({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "bg-destructive",
    warning: "bg-warning",
    info: "bg-info",
    success: "bg-success",
    insight: "bg-primary",
  };
  return <span className={cn("inline-block size-2 rounded-full", map[severity] ?? "bg-muted")} />;
}

export function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    critico: "border-destructive/40 bg-destructive/10 text-destructive",
    alto: "border-warning/40 bg-warning/10 text-warning",
    medio: "border-info/40 bg-info/10 text-info",
    bajo: "border-border bg-muted/40 text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize",
        map[risk] ?? map.bajo,
      )}
    >
      {risk}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendiente: "border-warning/40 bg-warning/10 text-warning",
    confirmado: "border-info/40 bg-info/10 text-info",
    preparando: "border-info/40 bg-info/10 text-info",
    enviado: "border-primary/40 bg-primary/10 text-primary",
    entregado: "border-success/40 bg-success/10 text-success",
    cancelado: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize",
        map[status] ?? "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
