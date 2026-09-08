import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiCard, Panel } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { currency, dateTime, downloadCsv, number } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/transacciones")({
  head: () => ({
    meta: [
      { title: "Transacciones y auditoría — AURA AI" },
      {
        name: "description",
        content:
          "Historial transaccional y bitácora de auditoría de todas las operaciones críticas del negocio.",
      },
      { property: "og:title", content: "Transacciones y auditoría — AURA AI" },
      {
        property: "og:description",
        content: "Quién hizo qué, cuándo y sobre qué entidad, con estado anterior y posterior.",
      },
    ],
  }),
  component: TransaccionesPage,
});

function TransaccionesPage() {
  const [query, setQuery] = useState("");

  const transactions = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, customers(first_name,last_name), orders(code)")
        .order("created_at", { ascending: false })
        .limit(400);
      if (error) throw error;
      return data;
    },
  });

  const audit = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(400);
      if (error) throw error;
      return data;
    },
  });

  const txRows = (transactions.data ?? []).filter((t) =>
    `${t.description ?? ""} ${t.type}`.toLowerCase().includes(query.toLowerCase()),
  );
  const auditRows = (audit.data ?? []).filter((a) =>
    `${a.action} ${a.entity}`.toLowerCase().includes(query.toLowerCase()),
  );

  const income = (transactions.data ?? []).reduce((a, t) => a + Number(t.amount), 0);

  return (
    <AppShell
      require="staff"
      title="Control transaccional"
      description="Registro económico y bitácora de auditoría de operaciones críticas"
      actions={
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            className="h-8 w-48 text-xs"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadCsv(
                "transacciones.csv",
                txRows.map((t) => ({
                  fecha: t.created_at,
                  tipo: t.type,
                  monto: Number(t.amount).toFixed(2),
                  descripcion: t.description ?? "",
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
        <KpiCard label="Transacciones" value={number(transactions.data?.length ?? 0)} />
        <KpiCard label="Monto acumulado" value={currency(income)} tone="success" />
        <KpiCard label="Eventos auditados" value={number(audit.data?.length ?? 0)} />
      </div>

      <Tabs defaultValue="transacciones" className="mt-4">
        <TabsList>
          <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="transacciones">
          <Panel title="Movimientos económicos">
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left font-medium">Fecha</th>
                    <th className="p-2 text-left font-medium">Tipo</th>
                    <th className="p-2 text-left font-medium">Pedido</th>
                    <th className="p-2 text-left font-medium">Descripción</th>
                    <th className="p-2 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {txRows.map((t) => (
                    <tr key={t.id} className="border-t border-border/60">
                      <td className="p-2 text-xs text-muted-foreground">{dateTime(t.created_at)}</td>
                      <td className="p-2 capitalize">{t.type}</td>
                      <td className="text-numeric p-2">
                        {(t.orders as { code: string } | null)?.code ?? "—"}
                      </td>
                      <td className="p-2 text-muted-foreground">{t.description ?? "—"}</td>
                      <td className="text-numeric p-2 text-right">{currency(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="auditoria">
          <Panel title="Bitácora de auditoría" description="Solo visible para administradores">
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left font-medium">Fecha</th>
                    <th className="p-2 text-left font-medium">Acción</th>
                    <th className="p-2 text-left font-medium">Entidad</th>
                    <th className="p-2 text-left font-medium">Antes</th>
                    <th className="p-2 text-left font-medium">Después</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((a) => (
                    <tr key={a.id} className="border-t border-border/60 align-top">
                      <td className="p-2 text-xs text-muted-foreground">{dateTime(a.created_at)}</td>
                      <td className="p-2">{a.action}</td>
                      <td className="p-2 text-muted-foreground">{a.entity}</td>
                      <td className="text-numeric p-2 text-xs text-muted-foreground">
                        {a.old_data ? JSON.stringify(a.old_data) : "—"}
                      </td>
                      <td className="text-numeric p-2 text-xs text-muted-foreground">
                        {a.new_data ? JSON.stringify(a.new_data) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditRows.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  Sin registros disponibles con tu rol actual.
                </p>
              )}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
