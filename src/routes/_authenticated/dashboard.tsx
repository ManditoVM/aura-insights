import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Brain, PackageX, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiCard, Panel, RiskBadge } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import { useIntelligence, useOrders } from "@/hooks/useBusiness";
import { dailySeries } from "@/lib/analytics";
import { currency, compactCurrency, number, shortDate } from "@/lib/format";
import { auraInsightsBriefing } from "@/lib/aura.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const STATUS_COLORS: Record<string, string> = {
  pendiente: "var(--chart-3)",
  confirmado: "var(--chart-2)",
  preparando: "var(--chart-2)",
  enviado: "var(--chart-1)",
  entregado: "var(--chart-4)",
  cancelado: "var(--destructive)",
};

function Dashboard() {
  const { metrics, sales, restock, anomalies, isLoading } = useIntelligence();
  const orders = useOrders();
  const briefingFn = useServerFn(auraInsightsBriefing);
  const [briefing, setBriefing] = useState<string | null>(null);

  const briefingMutation = useMutation({
    mutationFn: () => briefingFn({ data: undefined }),
    onSuccess: (r) => setBriefing(r.briefing),
    onError: (e: Error) => toast.error(e.message),
  });

  const series = useMemo(() => dailySeries(sales, 30), [sales]);

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);

  const salesToday = series.find((s) => s.date === today)?.revenue ?? 0;
  const salesMonth = series
    .filter((s) => new Date(s.date) >= monthStart)
    .reduce((a, s) => a + s.revenue, 0);

  const allOrders = orders.data ?? [];
  const pending = allOrders.filter((o) => o.status === "pendiente").length;
  const inventoryValue = metrics.reduce((a, m) => a + m.stockValue, 0);
  const lowStock = metrics.filter((m) => m.product.stock <= m.product.min_stock).length;

  const topProducts = [...metrics].sort((a, b) => b.soldLast30 - a.soldLast30).slice(0, 7);
  const statusData = Object.entries(
    allOrders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([status, value]) => ({ status, value }));

  const atRisk = metrics
    .filter((m) => m.risk === "critico" || m.risk === "alto")
    .sort((a, b) => (a.daysToStockout ?? 999) - (b.daysToStockout ?? 999))
    .slice(0, 6);

  return (
    <AppShell
      require="staff"
      title="Dashboard ejecutivo"
      description="Métricas en vivo de la operación · datos reales de la base de datos"
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/aura">
            <Sparkles className="size-4" /> Preguntar a AURA
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Ventas de hoy" value={currency(salesToday)} hint="Pedidos no cancelados" />
        <KpiCard label="Ventas del mes" value={currency(salesMonth)} hint="Acumulado mensual" />
        <KpiCard
          label="Pedidos pendientes"
          value={number(pending)}
          tone={pending > 0 ? "warning" : "default"}
          hint="Esperando confirmación"
        />
        <KpiCard
          label="Valor de inventario"
          value={compactCurrency(inventoryValue)}
          hint="Valuado a costo"
        />
        <KpiCard label="Productos activos" value={number(metrics.length)} />
        <KpiCard
          label="Stock bajo mínimo"
          value={number(lowStock)}
          tone={lowStock > 0 ? "critical" : "success"}
          icon={<PackageX className="size-4" />}
        />
        <KpiCard label="Clientes con compras" value={number(new Set(allOrders.map((o) => o.customer_id)).size)} />
        <KpiCard
          label="Anomalías detectadas"
          value={number(anomalies.length)}
          tone={anomalies.length ? "warning" : "default"}
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Ventas de los últimos 30 días" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => shortDate(d)}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => compactCurrency(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => currency(v)}
                  labelFormatter={(d) => shortDate(d as string)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  fill="url(#rev)"
                  strokeWidth={2}
                  name="Ingreso"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Pedidos por estado">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "var(--muted)"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            {statusData.map((s) => (
              <div key={s.status} className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: STATUS_COLORS[s.status] ?? "var(--muted)" }}
                />
                <span className="capitalize">{s.status}</span>
                <span className="text-numeric ml-auto text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Productos más vendidos (30 días)" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts.map((m) => ({ name: m.product.name, unidades: m.soldLast30 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} interval={0} angle={-12} textAnchor="end" height={60} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                />
                <Bar dataKey="unidades" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="AURA Insights"
          description="Cálculos deterministas sobre datos reales"
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => briefingMutation.mutate()}
              disabled={briefingMutation.isPending || isLoading}
            >
              <Brain className="size-4" />
              {briefingMutation.isPending ? "Analizando…" : "Resumen IA"}
            </Button>
          }
        >
          <div className="space-y-3">
            {briefing && (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed whitespace-pre-wrap">
                {briefing}
              </div>
            )}

            {atRisk.map((m) => (
              <div key={m.product.id} className="rounded-md border border-border bg-surface/60 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-3.5 text-warning" />
                  <p className="flex-1 truncate text-sm font-medium">{m.product.name}</p>
                  <RiskBadge risk={m.risk} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Stock {m.product.stock} u · promedio {m.avgDaily.toFixed(1)} u/día ·{" "}
                  {m.daysToStockout === null
                    ? "sin ventas recientes"
                    : `agotamiento en ~${m.daysToStockout.toFixed(1)} días`}
                </p>
                {restock.find((r) => r.metrics.product.id === m.product.id) && (
                  <p className="mt-1 text-xs text-primary">
                    Recomendación: abastecer{" "}
                    {restock.find((r) => r.metrics.product.id === m.product.id)!.recommendedQty} u.
                  </p>
                )}
              </div>
            ))}

            {anomalies.slice(0, 2).map((a) => (
              <div key={a.productId + a.date} className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center gap-2">
                  {a.direction === "alza" ? (
                    <TrendingUp className="size-3.5 text-destructive" />
                  ) : (
                    <TrendingDown className="size-3.5 text-destructive" />
                  )}
                  <p className="text-sm font-medium">Anomalía en {a.productName}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {shortDate(a.date)}: {a.units} u vendidas frente a un promedio de {a.mean} u
                  (z = {a.zScore}).
                </p>
              </div>
            ))}

            {!isLoading && atRisk.length === 0 && anomalies.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Sin riesgos ni anomalías detectadas con los datos actuales.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
