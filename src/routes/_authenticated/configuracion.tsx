import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Workflow } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/data-card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { dateOnly } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración — AURA AI" },
      {
        name: "description",
        content: "Roles del equipo, reglas de negocio y puntos de integración para automatizaciones.",
      },
      { property: "og:title", content: "Configuración — AURA AI" },
      {
        property: "og:description",
        content: "Administración de accesos, reglas operativas y automatización.",
      },
    ],
  }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const { user, roles } = useAuth();

  const team = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,active,created_at")
        .order("created_at");
      if (error) throw error;
      const { data: userRoles } = await supabase.from("user_roles").select("user_id,role");
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (userRoles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
  });

  return (
    <AppShell
      require="admin"
      title="Configuración"
      description="Accesos, reglas de negocio e integraciones"
    >

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Tu cuenta">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Correo</dt>
              <dd>{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Roles</dt>
              <dd className="capitalize">{roles.join(", ") || "sin rol"}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Reglas de negocio activas" description="Aplicadas en la base de datos, no en el navegador">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              Confirmar un pedido valida existencias, descuenta inventario, registra el movimiento y
              la transacción dentro de una misma operación.
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              El stock nunca queda negativo ni se modifica sin generar un movimiento auditado.
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              Al caer por debajo del mínimo, el producto genera una alerta automática.
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              El acceso a cada módulo depende del rol: administrador, empleado o cliente.
            </li>
          </ul>
        </Panel>

        <Panel title="Equipo y roles" description="Cuentas registradas en la plataforma">
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2 text-left font-medium">Nombre</th>
                  <th className="p-2 text-left font-medium">Correo</th>
                  <th className="p-2 text-left font-medium">Roles</th>
                  <th className="p-2 text-right font-medium">Alta</th>
                </tr>
              </thead>
              <tbody>
                {(team.data ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="p-2">{p.full_name || "—"}</td>
                    <td className="p-2 text-muted-foreground">{p.email ?? "—"}</td>
                    <td className="p-2 capitalize">{p.roles.join(", ") || "cliente"}</td>
                    <td className="p-2 text-right text-xs text-muted-foreground">
                      {dateOnly(p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Automatización" description="Puntos de integración preparados para herramientas externas">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Workflow className="mt-0.5 size-4 shrink-0 text-primary" />
              Eventos disponibles: stock bajo mínimo, pedido creado, pedido confirmado, riesgo de
              agotamiento, anomalía detectada y nueva transacción.
            </li>
            <li className="flex gap-2">
              <Workflow className="mt-0.5 size-4 shrink-0 text-primary" />
              La arquitectura admite endpoints firmados para conectar flujos externos (por ejemplo
              n8n), notificaciones por correo o mensajería.
            </li>
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
