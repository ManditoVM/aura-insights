import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Brain, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiCard, Panel, RiskBadge } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import { useIntelligence } from "@/hooks/useBusiness";
import { auraInsightsBriefing, auraPredictions } from "@/lib/aura.functions";
import { Markdown } from "@/components/markdown";
import { currency, dateOnly, number } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inteligencia")({
  head: () => ({
    meta: [
      { title: "Inteligencia — AURA AI" },
      {
        name: "description",
        content:
          "Predicción de demanda, riesgo de agotamiento, baja rotación, anomalías y recomendaciones de abastecimiento.",
      },
      { property: "og:title", content: "Inteligencia — AURA AI" },
      {
        property: "og:description",
        content: "Cálculos deterministas sobre datos reales, redactados y priorizados por AURA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InteligenciaPage,
});

function InteligenciaPage() {
  const { metrics, restock, anomalies, isLoading } = useIntelligence();
  const briefingFn = useServerFn(auraInsightsBriefing);
  const predictionsFn = useServerFn(auraPredictions);
  const qc = useQueryClient();
  const briefing = useQuery({ queryKey: ["aura-briefing"], queryFn: () => briefingFn({ data: { force: false } }), staleTime: 4 * 60 * 60 * 1000 });
  const predictions = useQuery({ queryKey: ["aura-predictions"], queryFn: () => predictionsFn({ data: { force: false } }), staleTime: 4 * 60 * 60 * 1000 });

  const regenerateBriefing = useMutation({
    mutationFn: () => briefingFn({ data: { force: true } }),
    onSuccess: (value) => qc.setQueryData(["aura-briefing"], value),
    onError: (e: Error) => toast.error(e.message),
  });
  const regeneratePredictions = useMutation({
    mutationFn: () => predictionsFn({ data: { force: true } }),
    onSuccess: (value) => qc.setQueryData(["aura-predictions"], value),
    onError: (e: Error) => toast.error(e.message),
  });

  const lowRotation = metrics.filter((m) => m.lowRotation);
  const highDemand = [...metrics].sort((a, b) => b.soldLast30 - a.soldLast30).slice(0, 8);
  const risky = metrics.filter((m) => m.risk === "critico" || m.risk === "alto");

  return (
    <AppShell
      require="staff"
      title="Centro de inteligencia"
      description="Cálculos deterministas sobre datos reales · las estimaciones se etiquetan como predicción"
      actions={
        <Button size="sm" onClick={() => regenerateBriefing.mutate()} disabled={regenerateBriefing.isPending || briefing.isFetching}>
          <Sparkles className="size-4" />
          {regenerateBriefing.isPending ? "Analizando…" : "Regenerar informe AURA"}
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Productos en riesgo"
          value={number(risky.length)}
          tone={risky.length > 0 ? "warning" : "success"}
          icon={<AlertTriangle className="size-4" />}
        />
        <KpiCard label="Baja rotación" value={number(lowRotation.length)} icon={<TrendingDown className="size-4" />} />
        <KpiCard
          label="Anomalías detectadas"
          value={number(anomalies.length)}
          tone={anomalies.length > 0 ? "critical" : "default"}
          icon={<Brain className="size-4" />}
        />
        <KpiCard
          label="Recomendaciones de compra"
          value={number(restock.length)}
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      {briefing.error && <p className="mt-4 text-sm text-destructive">{briefing.error.message}</p>}
      {briefing.data?.briefing && (
        <Panel
          className="mt-4"
          title="Informe ejecutivo AURA"
          description={`Generado por IA · ${dateOnly(briefing.data.generatedAt)}`}
        >
          <Markdown className="text-sm leading-relaxed">{briefing.data.briefing}</Markdown>
        </Panel>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Predicción de demanda (7 días)"
          description="Regresión lineal sobre la serie diaria de 28 días · estimación, no dato real"
          actions={<Button size="sm" variant="outline" onClick={() => regeneratePredictions.mutate()} disabled={regeneratePredictions.isPending || predictions.isFetching}>{regeneratePredictions.isPending ? "Calculando…" : "Recalcular"}</Button>}
        >
          {predictions.error && <p className="text-sm text-destructive">{predictions.error.message}</p>}
          {predictions.data?.[0] && <p className="mb-2 text-xs text-muted-foreground">Actualizado: {dateOnly(predictions.data[0].generated_at)}</p>}
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2 text-left font-medium">Producto</th>
                  <th className="p-2 text-right font-medium">30 días</th>
                  <th className="p-2 text-right font-medium">Estimado 7 d</th>
                  <th className="p-2 text-right font-medium">Tendencia</th>
                  <th className="p-2 text-right font-medium">Confianza</th>
                </tr>
              </thead>
              <tbody>
                {highDemand.map((m) => {
                  const saved = predictions.data?.find((p) => p.product_id === m.product.id);
                  return (
                  <tr key={m.product.id} className="border-t border-border/60">
                    <td className="p-2">{m.product.name}</td>
                    <td className="text-numeric p-2 text-right">{number(m.soldLast30)}</td>
                    <td className="text-numeric p-2 text-right text-primary">{saved ? number(saved.estimated_demand) : "—"}</td>
                    <td className="p-2 text-right text-xs capitalize text-muted-foreground">
                      {saved?.trend ?? "—"}
                    </td>
                    <td className="text-numeric p-2 text-right text-xs">
                      {saved?.confidence == null ? "—" : `${Math.round(saved.confidence * 100)}%`}
                    </td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Recomendaciones de abastecimiento"
          description="Recomendación de IA basada en cálculos · no genera órdenes automáticas"
        >
          <div className="max-h-96 space-y-2 overflow-auto">
            {restock.map((r) => (
              <div key={r.metrics.product.id} className="rounded-md border border-border/60 bg-surface/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{r.metrics.product.name}</p>
                  <RiskBadge risk={r.metrics.risk} />
                </div>
                <p className="text-numeric mt-1 text-sm text-primary">
                  Comprar {number(r.recommendedQty)} unidades
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{r.rationale}</p>
              </div>
            ))}
            {!isLoading && restock.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin necesidades de abastecimiento.</p>
            )}
          </div>
        </Panel>

        <Panel title="Baja rotación" description="Inventario inmovilizado que ocupa capital">
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2 text-left font-medium">Producto</th>
                  <th className="p-2 text-right font-medium">Stock</th>
                  <th className="p-2 text-right font-medium">Últ. venta</th>
                  <th className="p-2 text-right font-medium">Capital</th>
                </tr>
              </thead>
              <tbody>
                {lowRotation.map((m) => (
                  <tr key={m.product.id} className="border-t border-border/60">
                    <td className="p-2">{m.product.name}</td>
                    <td className="text-numeric p-2 text-right">{number(m.product.stock)}</td>
                    <td className="p-2 text-right text-xs text-muted-foreground">
                      {m.lastSaleAt ? dateOnly(m.lastSaleAt) : "sin ventas"}
                    </td>
                    <td className="text-numeric p-2 text-right">{currency(m.stockValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lowRotation.length === 0 && (
              <p className="p-2 text-sm text-muted-foreground">Toda la mercancía rota con normalidad.</p>
            )}
          </div>
        </Panel>

        <Panel
          title="Detección de anomalías"
          description="Días con desviación estándar ≥ 3 respecto a la media diaria"
        >
          <div className="max-h-80 space-y-2 overflow-auto">
            {anomalies.map((a, i) => (
              <div key={i} className="rounded-md border border-border/60 bg-surface/40 p-3">
                <p className="text-sm font-medium">
                  {a.productName} · {a.direction === "alza" ? "pico" : "caída"} de ventas
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dateOnly(a.date)} · {number(a.units)} u. vendidas frente a una media de {a.mean} u.
                  (desviación {a.stdDev}, z = {a.zScore}).
                </p>
              </div>
            ))}
            {anomalies.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No se detectaron comportamientos atípicos en los últimos 30 días.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
