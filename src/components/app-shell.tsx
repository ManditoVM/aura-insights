import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  ShoppingCart,
  Receipt,
  Brain,
  Bell,
  FileBarChart,
  Sparkles,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { AuraMark } from "@/components/aura-mark";
import { useAuth } from "@/hooks/useAuth";
import { useAlerts } from "@/hooks/useBusiness";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Users; staffOnly?: boolean; adminOnly?: boolean };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, staffOnly: true },
  { to: "/clientes", label: "Clientes", icon: Users, staffOnly: true },
  { to: "/productos", label: "Productos", icon: Package, staffOnly: true },
  { to: "/inventario", label: "Inventario", icon: Boxes, staffOnly: true },
  { to: "/pedidos", label: "Pedidos", icon: ShoppingCart, staffOnly: true },
  { to: "/transacciones", label: "Transacciones", icon: Receipt, staffOnly: true },
  { to: "/inteligencia", label: "Inteligencia", icon: Brain, staffOnly: true },
  { to: "/aura", label: "Asistente AURA", icon: Sparkles, staffOnly: true },
  { to: "/alertas", label: "Alertas", icon: Bell, staffOnly: true },
  { to: "/reportes", label: "Reportes", icon: FileBarChart, staffOnly: true },
  { to: "/configuracion", label: "Configuración", icon: Settings, adminOnly: true },
  { to: "/mis-pedidos", label: "Mis pedidos", icon: ShoppingCart },
];

export function AppShell({
  title,
  description,
  actions,
  require: requiredRole,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  require?: "staff" | "admin";
  children: ReactNode;
}) {
  const { isStaff, isAdmin, loading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const alerts = useAlerts();
  const unread = (alerts.data ?? []).filter((a) => !a.read).length;

  const items = NAV.filter((i) => (i.adminOnly ? isAdmin : i.staffOnly ? isStaff : true));
  const allowed =
    !requiredRole || loading || (requiredRole === "admin" ? isAdmin : isStaff);


  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <AuraMark className="size-7" />
          <div className="leading-tight">
            <p className="text-display text-sm font-semibold">AURA AI</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Business OS
            </p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar">
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {item.to === "/alertas" && unread > 0 && (
                  <span className="text-numeric rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-2 text-xs text-muted-foreground">{user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-2 text-muted-foreground"
            onClick={async () => {
              await signOut();
              await navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-display truncate text-lg font-semibold">{title}</h1>
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
