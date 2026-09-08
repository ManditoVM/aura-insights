import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiCard, Panel } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomers, useIntelligence, useMovements, useOrders } from "@/hooks/useBusiness";
import { currency, dateOnly, downloadCsv, number } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes — AURA AI" },
      {
        name: "description",
        content:
          "Reportes de ventas, inventario, pedidos, clientes y movimientos con filtros por periodo y exportación CSV.",
      },
      { property: "og:title", content: "Reportes — AURA AI" },
      {
        property: "og:description",
        content: "Filtra por hoy, semana, mes o año y exporta la información a CSV.",
      },
    ],
  }),
  component: ReportesPage,
});

const RANGES: Record<string, number> = { hoy: 1, semana: 7, mes: 30, trimestre: 90, anio: 365 };

function ReportesPage() {
  const [range, setRange] = useState("mes");
  const [report, setReport] = useState("ventas");
  const orders = useOrders();
  const customers = useCustomers();
  const movements = useMovements();
  const { metrics } = useIntelligence();

  const since = Date.now() - (RANGES[range] ?? 30) * 86_400_000;
  const inRange = (d: string) => new Date(d).getTime() >= since;

  const sales = (orders.data ?? []).filter(
    (o) => inRange(o.created_at) && o.status !== "cancelado" && o.status !== "pendiente",
  );
  const revenue = sales.reduce((a, o) => a + Number(o.total), 0);
  const newCustomers = (customers.data ?? []).filter((c) => inRange(c.created_at));
  const rangeMovements = (movements.data ?? []).filter((m) => inRange(m.created_at));

  const table: { rows: Record<string, unknown>[]; headers: string[] } = (() => {
    if (report === "ventas")
      return {
        headers: ["Pedido", "Fecha", "Estado", "Total"],
        rows: sales.map((o) => ({
          Pedido: o.code,
          Fecha: dateOnly(o.created_at),
          Estado: o.status,
          Total: currency(o.total),
        })),
      };
    if (report === "inventario")
      return {
        headers: ["SKU", "Producto", "Stock", "Mínimo", "Valor"],
        rows: metrics.map((m) => ({
          SKU: m.product.sku,
          Producto: m.product.name,
          Stock: m.product.stock,
          Mínimo: m.product.min_stock,
          Valor: currency(m.stockValue),
        })),
      };
    if (report === "clientes")
      return {
        headers: ["Cliente", "Email", "Ciudad", "Alta"],
        rows: (customers.data ?? []).map((c) => ({
          Cliente: `${c.first_name} ${c.last_name}`,
          Email: c.email ?? "—",
          Ciudad: c.city ?? "—",
          Alta: dateOnly(c.created_at),
        })),
      };
    return {
      headers: ["Fecha", "Producto", "Tipo", "Cantidad", "Stock final"],
      rows: rangeMovements.map((m) => ({
        Fecha: dateOnly(m.created_at),
        Producto: (m.products as { name: string } | null)?.name ?? "—",
        Tipo: m.type,
        Cantidad: m.quantity,
        "Stock final": m.stock_after,
      })),
    };
  })();

  return (
    <AppShell
      require="staff"
      title="Reportes"
      description="Consulta y exporta la información operativa por periodo"
      actions={
        <div className="flex gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Última semana</SelectItem>
              <SelectItem value="mes">Último mes</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="anio">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Select value={report} onValueChange={setReport}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ventas">Ventas</SelectItem>
              <SelectItem value="inventario">Inventario</SelectItem>
              <SelectItem value="clientes">Clientes</SelectItem>
              <SelectItem value="movimientos">Movimientos</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv(`reporte-${report}-${range}.csv`, table.rows)}
          >
            <Download className="size-4" /> Exportar CSV
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Ingresos del periodo" value={currency(revenue)} tone="success" />
        <KpiCard label="Pedidos facturados" value={number(sales.length)} />
        <KpiCard label="Clientes nuevos" value={number(newCustomers.length)} />
        <KpiCard label="Movimientos de inventario" value={number(rangeMovements.length)} />
      </div>

      <Panel className="mt-4" title={`Reporte de ${report}`} description={`${number(table.rows.length)} registros`}>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {table.headers.map((h) => (
                  <th key={h} className="p-2 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="border-t border-border/60">
                  {table.headers.map((h) => (
                    <td key={h} className="p-2">
                      {String(row[h] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
