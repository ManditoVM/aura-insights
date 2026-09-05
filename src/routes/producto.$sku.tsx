import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { usePublicProducts } from "@/hooks/usePublicCatalog";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/producto/$sku")({
  head: () => ({
    meta: [
      { title: "Ficha de producto — AURA AI" },
      {
        name: "description",
        content:
          "Detalle del producto: precio vigente, disponibilidad, marca, categoría y alternativas del catálogo de AURA AI.",
      },
      { property: "og:title", content: "Ficha de producto — AURA AI" },
      {
        property: "og:description",
        content: "Precio, disponibilidad y alternativas reales del catálogo de AURA AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductoDetalle,
});

function ProductoDetalle() {
  const { sku } = useParams({ from: "/producto/$sku" });
  const products = usePublicProducts();
  const product = (products.data ?? []).find((p) => p.sku === sku);
  const related = (products.data ?? [])
    .filter((p) => p.sku !== sku && p.category_id === product?.category_id && p.stock > 0)
    .slice(0, 3);

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al catálogo
        </Link>

        {products.isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Cargando producto…</p>
        ) : !product ? (
          <div className="panel mt-8 p-10 text-center text-sm text-muted-foreground">
            No encontramos un producto con el código {sku}.
          </div>
        ) : (
          <>
            <div className="panel mt-6 p-8">
              <p className="text-xs text-muted-foreground">
                {product.brand ?? "Sin marca"} · {product.categories?.name ?? "Sin categoría"} · SKU {product.sku}
              </p>
              <h1 className="text-display mt-2 text-3xl font-semibold tracking-tight">{product.name}</h1>
              <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{product.description}</p>

              <div className="mt-8 flex flex-wrap items-center gap-6">
                <p className="text-numeric text-3xl font-semibold">{currency(product.price)}</p>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs",
                    product.stock > 0
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {product.stock > 0
                    ? `${product.stock} unidades disponibles`
                    : "Temporalmente agotado"}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Iniciar sesión para pedir
                </Link>
                <Link
                  to="/catalogo"
                  className="rounded-md border border-border/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/40"
                >
                  Seguir explorando
                </Link>
              </div>
            </div>

            {related.length > 0 && (
              <section className="mt-10">
                <h2 className="text-display text-lg font-semibold tracking-tight">
                  Alternativas disponibles
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {related.map((p) => (
                    <Link
                      key={p.id}
                      to="/producto/$sku"
                      params={{ sku: p.sku }}
                      className="panel p-4 transition-colors hover:border-primary/50"
                    >
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-numeric mt-2 text-base">{currency(p.price)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{p.stock} disponibles</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}
