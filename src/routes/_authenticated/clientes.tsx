import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCustomers, useOrders } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { currency, dateOnly, downloadCsv, number } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

type CustomerForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
};

const EMPTY: CustomerForm = { first_name: "", last_name: "", email: "", phone: "", address: "" };

function ClientesPage() {
  const customers = useCustomers();
  const orders = useOrders();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<CustomerForm | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; last: string | null }>();
    for (const o of orders.data ?? []) {
      if (o.status === "cancelado") continue;
      const s = map.get(o.customer_id) ?? { count: 0, total: 0, last: null };
      s.count += 1;
      s.total += Number(o.total);
      if (!s.last || o.created_at > s.last) s.last = o.created_at;
      map.set(o.customer_id, s);
    }
    return map;
  }, [orders.data]);

  const rows = (customers.data ?? []).filter((c) =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.phone ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const create = useMutation({
    mutationFn: async (values: CustomerForm) => {
      const { error } = await supabase.from("customers").insert({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone || null,
        address: values.address || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Cliente registrado");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const detail = (customers.data ?? []).find((c) => c.id === detailId);
  const detailOrders = (orders.data ?? []).filter((o) => o.customer_id === detailId);

  return (
    <AppShell
      title="Clientes"
      description={`${number(rows.length)} clientes · datos ficticios de demostración`}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                "clientes.csv",
                rows.map((c) => ({
                  nombre: `${c.first_name} ${c.last_name}`,
                  email: c.email,
                  telefono: c.phone ?? "",
                  registro: c.created_at,
                  pedidos: stats.get(c.id)?.count ?? 0,
                  total_comprado: (stats.get(c.id)?.total ?? 0).toFixed(2),
                })),
              )
            }
          >
            <Download className="size-4" /> CSV
          </Button>
          <Button size="sm" onClick={() => setForm(EMPTY)}>
            <Plus className="size-4" /> Nuevo cliente
          </Button>
        </div>
      }
    >
      <Panel>
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono"
            className="pl-9"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">Contacto</th>
                <th className="py-2 pr-4">Registro</th>
                <th className="py-2 pr-4 text-right">Pedidos</th>
                <th className="py-2 pr-4 text-right">Total comprado</th>
                <th className="py-2 pr-4">Última compra</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const s = stats.get(c.id);
                return (
                  <tr key={c.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium">
                        {c.first_name} {c.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.address ?? "—"}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      <p>{c.email}</p>
                      <p className="text-xs">{c.phone ?? "—"}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{dateOnly(c.created_at)}</td>
                    <td className="text-numeric py-2.5 pr-4 text-right">{s?.count ?? 0}</td>
                    <td className="text-numeric py-2.5 pr-4 text-right">{currency(s?.total ?? 0)}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{s?.last ? dateOnly(s.last) : "—"}</td>
                    <td className="py-2.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetailId(c.id)}>
                        Ver
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
          )}
        </div>
      </Panel>

      <Dialog open={form !== null} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
            <DialogDescription>Registra un cliente en la base de datos.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Apellidos</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Correo</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Dirección</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!form?.first_name || !form?.email || create.isPending}
              onClick={() => form && create.mutate(form)}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailId !== null} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detail?.first_name} {detail?.last_name}
            </DialogTitle>
            <DialogDescription>{detail?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="panel p-3">
              <p className="text-xs text-muted-foreground">Pedidos</p>
              <p className="text-numeric text-lg font-semibold">{stats.get(detailId ?? "")?.count ?? 0}</p>
            </div>
            <div className="panel p-3">
              <p className="text-xs text-muted-foreground">Total gastado</p>
              <p className="text-numeric text-lg font-semibold">
                {currency(stats.get(detailId ?? "")?.total ?? 0)}
              </p>
            </div>
            <div className="panel p-3">
              <p className="text-xs text-muted-foreground">Cliente desde</p>
              <p className="text-sm font-medium">{dateOnly(detail?.created_at)}</p>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Pedido</th>
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {detailOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0">
                    <td className="text-numeric py-2">{o.code}</td>
                    <td className="py-2 text-muted-foreground">{dateOnly(o.created_at)}</td>
                    <td className="py-2 capitalize text-muted-foreground">{o.status}</td>
                    <td className="text-numeric py-2 text-right">{currency(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {detailOrders.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin pedidos registrados.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
