import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Panel, StatusBadge } from "@/components/data-card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { currency, dateOnly } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/mis-pedidos")({
  component: MisPedidos,
});

function MisPedidos() {
  const { user } = useAuth();

  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(quantity, unit_price, line_total, products(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rows = orders.data ?? [];

  return (
    <AppShell title="Mis pedidos" description="Historial de tus compras en AURA AI">
      <div className="space-y-4">
        {rows.map((o) => (
          <Panel key={o.id} title={o.code} description={dateOnly(o.created_at)} actions={<StatusBadge status={o.status} />}>
            <div className="space-y-1 text-sm">
              {(o.order_items ?? []).map((i, idx) => (
                <div key={idx} className="flex justify-between text-muted-foreground">
                  <span>
                    {i.quantity} × {i.products?.name ?? "Producto"}
                  </span>
                  <span className="text-numeric">{currency(i.line_total)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 font-medium">
                <span>Total</span>
                <span className="text-numeric">{currency(o.total)}</span>
              </div>
            </div>
          </Panel>
        ))}
        {!orders.isLoading && rows.length === 0 && (
          <Panel>
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no tienes pedidos registrados.
            </p>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}
