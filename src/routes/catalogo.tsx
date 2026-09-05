import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, PackageX } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { usePublicProducts, usePublicCategories } from "@/hooks/usePublicCatalog";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo de productos — AURA AI" },
      {
        name: "description",
        content:
          "Consulta el catálogo de AURA AI: precios actualizados, disponibilidad en tiempo real y búsqueda por categoría.",
      },
      { property: "og:title", content: "Catálogo de productos — AURA AI" },
      {
        property: "og:description",
        content: "Precios y disponibilidad en tiempo real del catálogo de AURA AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
  const products = usePublicProducts();
  const categories = usePublicCategories();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<"nombre" | "precio-asc" | "precio-desc">("nombre");

  const list = useMemo(() => {
    let rows = products.data ?? [];
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((p) =>
        [p.name, p.sku, p.brand ?? "", p.description ?? ""].join(" ").toLowerCase().includes(q),
      );
    }
    if (category) rows = rows.filter((p) => p.category_id === category);
    return [...rows].sort((a, b) =>
      sort === "precio-asc"
        ? a.price - b.price
        : sort === "precio-desc"
          ? b.price - a.price
          : a.name.localeCompare(b.name),
    );
  }, [products.data, query, category, sort]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-display text-3xl font-semibold tracking-tight">Catálogo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Disponibilidad y precios tomados directamente de la base de datos.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, marca o SKU"
              className="w-full rounded-md border border-input bg-background py-2 pr-3 pl-9 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="nombre">Nombre (A-Z)</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              "rounded-full border border-border/60 px-3 py-1 text-xs transition-colors",
              category === null ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/40",
            )}
          >
            Todas
          </button>
          {(categories.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "rounded-full border border-border/60 px-3 py-1 text-xs transition-colors",
                category === c.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/40",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {products.isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Cargando catálogo…</p>
        ) : list.length === 0 ? (
          <div className="panel mt-10 flex flex-col items-center gap-2 p-10 text-center">
            <PackageX className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay productos que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <Link
                key={p.id}
                to="/producto/$sku"
                params={{ sku: p.sku }}
                className="panel flex flex-col p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.brand ?? "Sin marca"} · {p.categories?.name ?? "Sin categoría"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap",
                      p.stock > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                    )}
                  >
                    {p.stock > 0 ? `${p.stock} disp.` : "Agotado"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                <p className="text-numeric mt-4 text-lg font-semibold">{currency(p.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
