import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiCard, Panel, SeverityDot } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { dateTime, number } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/alertas")({
  head: () => ({
    meta: [
      { title: "Centro de alertas — AURA AI" },
      {
        name: "description",
        content:
          "Notificaciones críticas, advertencias, información e insights de IA generados por el sistema.",
      },
      { property: "og:title", content: "Centro de alertas — AURA AI" },
      {
        property: "og:description",
        content: "Alertas automáticas de stock, riesgo y anomalías con nivel de severidad.",
      },
    ],
  }),
  component: AlertasPage,
});

const LABEL: Record<string, string> = {
  critical: "Crítica",
  warning: "Advertencia",
  info: "Información",
  success: "Éxito",
  insight: "Insight de IA",
};

function AlertasPage() {
  const alerts = useAlerts();
  const qc = useQueryClient();
  const rows = alerts.data ?? [];
  const unread = rows.filter((a) => !a.read);

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("alerts").update({ read: true }).in("id", ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Alertas marcadas como leídas");
      void qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      require="staff"
      title="Centro de alertas"
      description="Eventos generados automáticamente por reglas del sistema y por la capa de inteligencia"
      actions={
        unread.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markRead.mutate(unread.map((a) => a.id))}
            disabled={markRead.isPending}
          >
            <CheckCheck className="size-4" /> Marcar todas como leídas
          </Button>
        )
      }
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Sin leer" value={number(unread.length)} tone={unread.length ? "warning" : "success"} />
        <KpiCard
          label="Críticas"
          value={number(rows.filter((a) => a.severity === "critical").length)}
          tone="critical"
        />
        <KpiCard label="Advertencias" value={number(rows.filter((a) => a.severity === "warning").length)} />
        <KpiCard label="Insights de IA" value={number(rows.filter((a) => a.severity === "insight").length)} />
      </div>

      <Panel className="mt-4" title="Historial de alertas">
        <div className="space-y-2">
          {rows.map((a) => (
            <div
              key={a.id}
              className={
                a.read
                  ? "rounded-md border border-border/50 bg-surface/20 p-3 opacity-70"
                  : "rounded-md border border-border bg-surface/50 p-3"
              }
            >
              <div className="flex items-center gap-2">
                <SeverityDot severity={a.severity} />
                <p className="text-sm font-medium">{a.title}</p>
                <span className="ml-auto text-[11px] uppercase tracking-wider text-muted-foreground">
                  {LABEL[a.severity] ?? a.severity}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
              <div className="mt-1 flex items-center gap-3">
                <p className="text-[11px] text-muted-foreground">{dateTime(a.created_at)}</p>
                {!a.read && (
                  <button
                    className="text-[11px] text-primary hover:underline"
                    onClick={() => markRead.mutate([a.id])}
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground">Sin alertas registradas.</p>}
        </div>
      </Panel>
    </AppShell>
  );
}
