import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Download, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiCard, Panel, RiskBadge } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useIntelligence, useMovements } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { currency, dateTime, downloadCsv, number } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario — AURA AI" },
      {
        name: "description",
        content:
          "Control de existencias en tiempo real con entradas, salidas y ajustes auditados en AURA AI.",
      },
      { property: "og:title", content: "Inventario — AURA AI" },
      {
        property: "og:description",
        content: "Cada movimiento de stock queda registrado con stock anterior y posterior.",
      },
    ],
  }),
  component: InventarioPage,
});

type MovementForm = { product_id: string; type: "entrada" | "salida" | "ajuste"; quantity: string; reason: string };

const EMPTY: MovementForm = { product_id: "", type: "entrada", quantity: "", reason: "" };

function InventarioPage() {
  const { metrics, isLoading } = useIntelligence();
  const [filter, setFilter] = useState("todos");
  const [form, setForm] = useState<MovementForm | null>(null);
  const movements = useMovements();
  const qc = useQueryClient();

  const rows = metrics.filter((m) =>
    filter === "bajo"
      ? m.product.stock <= m.product.min_stock
      : filter === "riesgo"
        ? m.risk === "critico" || m.risk === "alto"
        : true,
  );

  const stockValue = metrics.reduce((a, m) => a + m.stockValue, 0);
  const units = metrics.reduce((a, m) => a + m.product.stock, 0);
  const below = metrics.filter((m) => m.product.stock <= m.product.min_stock).length;
  const out = metrics.filter((m) => m.product.stock === 0).length;

  const register = useMutation({
    mutationFn: async (values: MovementForm) => {
      const { error } = await supabase.rpc("register_movement", {
        _product_id: values.product_id,
        _type: values.type,
        _quantity: Number(values.quantity),
        _reference: "MANUAL",
        ...(values.reason ? { _reason: values.reason } : {}),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Movimiento registrado");
      setForm(null);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      require="staff"
      title="Inventario"
      description="Existencias en tiempo real · todo cambio de stock genera un movimiento auditado"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setForm({ ...EMPTY })}>
            <SlidersHorizontal className="size-4" /> Registrar movimiento
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadCsv(
                "inventario.csv",
                metrics.map((m) => ({
                  sku: m.product.sku,
                  producto: m.product.name,
                  stock: m.product.stock,
                  minimo: m.product.min_stock,
                  maximo: m.product.max_stock,
                  valor_inventario: m.stockValue.toFixed(2),
                  riesgo: m.risk,
                })),
              )
            }
          >
            <Download className="size-4" /> CSV
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Valor del inventario" value={currency(stockValue)} hint="Valuado a costo" />
        <KpiCard label="Unidades en existencia" value={number(units)} />
        <KpiCard
          label="Productos bajo mínimo"
          value={number(below)}
          tone={below > 0 ? "warning" : "default"}
        />
        <KpiCard label="Agotados" value={number(out)} tone={out > 0 ? "critical" : "success"} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Existencias"
          description={isLoading ? "Cargando…" : `${number(rows.length)} productos`}
          actions={
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="bajo">Bajo mínimo</SelectItem>
                <SelectItem value="riesgo">En riesgo</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2 text-left font-medium">Producto</th>
                  <th className="p-2 text-right font-medium">Stock</th>
                  <th className="p-2 text-right font-medium">Mín.</th>
                  <th className="p-2 text-right font-medium">Días a agotarse</th>
                  <th className="p-2 text-right font-medium">Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.product.id} className="border-t border-border/60">
                    <td className="p-2">
                      <p className="font-medium">{m.product.name}</p>
                      <p className="text-numeric text-xs text-muted-foreground">{m.product.sku}</p>
                    </td>
                    <td className="text-numeric p-2 text-right">{number(m.product.stock)}</td>
                    <td className="text-numeric p-2 text-right text-muted-foreground">
                      {number(m.product.min_stock)}
                    </td>
                    <td className="text-numeric p-2 text-right">
                      {m.daysToStockout === null ? "—" : m.daysToStockout.toFixed(1)}
                    </td>
                    <td className="p-2 text-right">
                      <RiskBadge risk={m.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Movimientos recientes" description="Entradas, salidas y ajustes auditados">
          <div className="max-h-[520px] space-y-2 overflow-auto">
            {(movements.data ?? []).map((mv) => (
              <div
                key={mv.id}
                className="flex items-start gap-3 rounded-md border border-border/60 bg-surface/40 p-2"
              >
                {mv.type === "entrada" ? (
                  <ArrowDownCircle className="mt-0.5 size-4 text-success" />
                ) : mv.type === "salida" ? (
                  <ArrowUpCircle className="mt-0.5 size-4 text-warning" />
                ) : (
                  <SlidersHorizontal className="mt-0.5 size-4 text-info" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {(mv.products as { name: string } | null)?.name ?? "Producto"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mv.type} · {number(mv.quantity)} u. · {number(mv.stock_before)} →{" "}
                    {number(mv.stock_after)} · {mv.reason ?? "sin motivo"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{dateTime(mv.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Dialog open={form !== null} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar movimiento de inventario</DialogTitle>
            <DialogDescription>
              El stock nunca se modifica sin dejar registro: se guarda stock anterior, posterior,
              usuario y motivo.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.product_id || !Number(form.quantity)) {
                  toast.error("Selecciona producto y cantidad");
                  return;
                }
                register.mutate(form);
              }}
            >
              <div className="space-y-1.5">
                <Label>Producto</Label>
                <Select
                  value={form.product_id}
                  onValueChange={(v) => setForm({ ...form, product_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics.map((m) => (
                      <SelectItem key={m.product.id} value={m.product.id}>
                        {m.product.name} ({m.product.stock} u.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as MovementForm["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="salida">Salida</SelectItem>
                      <SelectItem value="ajuste">Ajuste (stock final)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Motivo</Label>
                <Input
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Compra a proveedor, merma, conteo físico…"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={register.isPending}>
                  Registrar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
