import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiCard, Panel, StatusBadge } from "@/components/data-card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCustomers, useIntelligence, useOrders } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { currency, dateTime, downloadCsv, number } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos — AURA AI" },
      {
        name: "description",
        content:
          "Gestión de pedidos con confirmación transaccional: valida stock, descuenta inventario y registra la venta.",
      },
      { property: "og:title", content: "Pedidos — AURA AI" },
      {
        property: "og:description",
        content: "Confirmar un pedido descuenta inventario y genera movimiento y transacción.",
      },
    ],
  }),
  component: PedidosPage,
});

const STATUSES = ["pendiente", "confirmado", "preparando", "enviado", "entregado", "cancelado"] as const;

type Line = { product_id: string; quantity: number };

function PedidosPage() {
  const orders = useOrders();
  const customers = useCustomers();
  const { metrics } = useIntelligence();
  const qc = useQueryClient();
  const [status, setStatus] = useState("todos");
  const [detail, setDetail] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const rows = (orders.data ?? []).filter((o) => status === "todos" || o.status === status);
  const pending = (orders.data ?? []).filter((o) => o.status === "pendiente");
  const monthTotal = (orders.data ?? [])
    .filter(
      (o) =>
        o.status !== "cancelado" &&
        o.status !== "pendiente" &&
        new Date(o.created_at).getMonth() === new Date().getMonth(),
    )
    .reduce((a, o) => a + Number(o.total), 0);

  const items = useQuery({
    queryKey: ["order-items", detail],
    enabled: !!detail,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*, products(name,sku)")
        .eq("order_id", detail!);
      if (error) throw error;
      return data;
    },
  });

  const confirm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("confirm_order", { _order_id: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Pedido confirmado: inventario descontado y transacción registrada");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: next as (typeof STATUSES)[number] })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await supabase.from("audit_logs").insert({
        action: "cambio_estado_pedido",
        entity: "order",
        entity_id: id,
        new_data: { status: next },
      });
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      void qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const subtotal = lines.reduce((a, l) => {
    const p = metrics.find((m) => m.product.id === l.product_id);
    return a + (p ? p.product.price * l.quantity : 0);
  }, 0);
  const tax = Math.round(subtotal * 0.16 * 100) / 100;

  const create = useMutation({
    mutationFn: async () => {
      if (!customerId || lines.length === 0) throw new Error("Selecciona cliente y productos");
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          subtotal,
          tax,
          total: Math.round((subtotal + tax) * 100) / 100,
        })
        .select("id,code")
        .single();
      if (error) throw new Error(error.message);

      const payload = lines.map((l) => {
        const p = metrics.find((m) => m.product.id === l.product_id)!;
        return {
          order_id: order.id,
          product_id: l.product_id,
          quantity: l.quantity,
          unit_price: p.product.price,
          line_total: Math.round(p.product.price * l.quantity * 100) / 100,
        };
      });
      const { error: itemsError } = await supabase.from("order_items").insert(payload);
      if (itemsError) throw new Error(itemsError.message);
      return order.code;
    },
    onSuccess: (code) => {
      toast.success(`Pedido ${code} creado en estado pendiente`);
      setCreating(false);
      setLines([]);
      setCustomerId("");
      void qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Pedidos"
      description="Al confirmar se valida stock, se descuenta inventario y se registra la transacción"
      actions={
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Nuevo pedido
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadCsv(
                "pedidos.csv",
                rows.map((o) => ({
                  codigo: o.code,
                  fecha: o.created_at,
                  estado: o.status,
                  total: Number(o.total).toFixed(2),
                })),
              )
            }
          >
            <Download className="size-4" /> CSV
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Pedidos totales" value={number(orders.data?.length ?? 0)} />
        <KpiCard
          label="Pendientes por confirmar"
          value={number(pending.length)}
          tone={pending.length > 0 ? "warning" : "success"}
        />
        <KpiCard label="Ventas del mes" value={currency(monthTotal)} tone="success" />
      </div>

      <Panel
        className="mt-4"
        title="Listado de pedidos"
        actions={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-2 text-left font-medium">Pedido</th>
                <th className="p-2 text-left font-medium">Cliente</th>
                <th className="p-2 text-left font-medium">Fecha</th>
                <th className="p-2 text-right font-medium">Total</th>
                <th className="p-2 text-left font-medium">Estado</th>
                <th className="p-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const c = o.customers as { first_name: string; last_name: string } | null;
                return (
                  <tr key={o.id} className="border-t border-border/60">
                    <td className="text-numeric p-2">
                      <button className="hover:text-primary" onClick={() => setDetail(o.id)}>
                        {o.code}
                      </button>
                    </td>
                    <td className="p-2">{c ? `${c.first_name} ${c.last_name}` : "—"}</td>
                    <td className="p-2 text-xs text-muted-foreground">{dateTime(o.created_at)}</td>
                    <td className="text-numeric p-2 text-right">{currency(o.total)}</td>
                    <td className="p-2">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="p-2 text-right">
                      {o.status === "pendiente" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={confirm.isPending}
                          onClick={() => confirm.mutate(o.id)}
                        >
                          <CheckCircle2 className="size-4" /> Confirmar
                        </Button>
                      ) : (
                        <Select
                          value={o.status}
                          onValueChange={(next) => changeStatus.mutate({ id: o.id, next })}
                        >
                          <SelectTrigger className="ml-auto h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.filter((s) => s !== "pendiente").map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del pedido</DialogTitle>
            <DialogDescription>Líneas registradas con precio unitario al momento de la venta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {(items.data ?? []).map((i) => (
              <div key={i.id} className="flex justify-between border-b border-border/60 pb-1">
                <span>
                  {number(i.quantity)} × {(i.products as { name: string } | null)?.name}
                </span>
                <span className="text-numeric">{currency(i.line_total)}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo pedido</DialogTitle>
            <DialogDescription>
              El pedido se crea pendiente. El inventario se descuenta al confirmarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {(customers.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {lines.map((l, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Producto</Label>
                  <Select
                    value={l.product_id}
                    onValueChange={(v) =>
                      setLines(lines.map((x, i) => (i === idx ? { ...x, product_id: v } : x)))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {metrics.map((m) => (
                        <SelectItem key={m.product.id} value={m.product.id}>
                          {m.product.name} · {currency(m.product.price)} ({m.product.stock} u.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1.5">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) =>
                      setLines(
                        lines.map((x, i) =>
                          i === idx ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x,
                        ),
                      )
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setLines([...lines, { product_id: "", quantity: 1 }])}
            >
              <Plus className="size-4" /> Agregar producto
            </Button>

            <div className="rounded-md border border-border bg-surface/50 p-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-numeric">{currency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA 16%</span>
                <span className="text-numeric">{currency(tax)}</span>
              </div>
              <div className="mt-1 flex justify-between font-medium">
                <span>Total</span>
                <span className="text-numeric">{currency(subtotal + tax)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !customerId || lines.length === 0}
            >
              Crear pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
