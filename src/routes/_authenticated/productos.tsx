import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Panel, RiskBadge } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useCategories, useIntelligence } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { currency, downloadCsv, number } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/productos")({
  component: ProductosPage,
});

type ProductForm = {
  id?: string;
  sku: string;
  name: string;
  description: string;
  brand: string;
  category_id: string;
  price: string;
  cost: string;
  min_stock: string;
  max_stock: string;
};

const EMPTY: ProductForm = {
  sku: "",
  name: "",
  description: "",
  brand: "",
  category_id: "",
  price: "",
  cost: "",
  min_stock: "10",
  max_stock: "120",
};

function ProductosPage() {
  const { metrics, products, isLoading } = useIntelligence();
  const categories = useCategories();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todas");
  const [sort, setSort] = useState("nombre");
  const [form, setForm] = useState<ProductForm | null>(null);

  const raw = products;


  let rows = metrics.filter((m) => {
    const p = raw.find((r) => r.id === m.product.id);
    const matchQuery = `${m.product.name} ${m.product.sku} ${p?.brand ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchCat = category === "todas" || p?.category_id === category;
    return matchQuery && matchCat;
  });

  rows = [...rows].sort((a, b) => {
    if (sort === "stock") return a.product.stock - b.product.stock;
    if (sort === "ventas") return b.soldLast30 - a.soldLast30;
    if (sort === "precio") return b.product.price - a.product.price;
    return a.product.name.localeCompare(b.product.name);
  });

  const save = useMutation({
    mutationFn: async (values: ProductForm) => {
      const payload = {
        sku: values.sku,
        name: values.name,
        description: values.description || null,
        brand: values.brand || null,
        category_id: values.category_id || null,
        price: Number(values.price),
        cost: Number(values.cost),
        min_stock: Number(values.min_stock),
        max_stock: Number(values.max_stock),
      };
      const { error } = values.id
        ? await supabase.from("products").update(payload).eq("id", values.id)
        : await supabase.from("products").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Producto guardado");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Catálogo de productos"
      description={`${number(rows.length)} productos · el stock solo cambia mediante movimientos de inventario`}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                "productos.csv",
                rows.map((m) => ({
                  sku: m.product.sku,
                  nombre: m.product.name,
                  precio: m.product.price,
                  costo: m.product.cost,
                  stock: m.product.stock,
                  minimo: m.product.min_stock,
                  vendidos_30d: m.soldLast30,
                  riesgo: m.risk,
                })),
              )
            }
          >
            <Download className="size-4" /> CSV
          </Button>
          <Button size="sm" onClick={() => setForm(EMPTY)}>
            <Plus className="size-4" /> Nuevo producto
          </Button>
        </div>
      }
    >
      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU o marca"
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {(categories.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Nombre</SelectItem>
              <SelectItem value="stock">Menor stock</SelectItem>
              <SelectItem value="ventas">Más vendidos</SelectItem>
              <SelectItem value="precio">Mayor precio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4">Producto</th>
                <th className="py-2 pr-4">Categoría</th>
                <th className="py-2 pr-4 text-right">Precio</th>
                <th className="py-2 pr-4 text-right">Stock</th>
                <th className="py-2 pr-4 text-right">Mín.</th>
                <th className="py-2 pr-4 text-right">Vend. 30d</th>
                <th className="py-2 pr-4">Riesgo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const p = raw.find((r) => r.id === m.product.id);
                return (
                  <tr key={m.product.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium">{m.product.name}</p>
                      <p className="text-numeric text-xs text-muted-foreground">{m.product.sku}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{p?.categories?.name ?? "—"}</td>
                    <td className="text-numeric py-2.5 pr-4 text-right">{currency(m.product.price)}</td>
                    <td
                      className={`text-numeric py-2.5 pr-4 text-right ${
                        m.product.stock <= m.product.min_stock ? "text-destructive" : ""
                      }`}
                    >
                      {m.product.stock}
                    </td>
                    <td className="text-numeric py-2.5 pr-4 text-right text-muted-foreground">
                      {m.product.min_stock}
                    </td>
                    <td className="text-numeric py-2.5 pr-4 text-right">{m.soldLast30}</td>
                    <td className="py-2.5 pr-4">
                      <RiskBadge risk={m.risk} />
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          p &&
                          setForm({
                            id: p.id,
                            sku: p.sku,
                            name: p.name,
                            description: p.description ?? "",
                            brand: p.brand ?? "",
                            category_id: p.category_id ?? "",
                            price: String(p.price),
                            cost: String(p.cost),
                            min_stock: String(p.min_stock),
                            max_stock: String(p.max_stock),
                          })
                        }
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && rows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
          )}
        </div>
      </Panel>

      <Dialog open={form !== null} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            <DialogDescription>
              El stock inicial se genera registrando una entrada en el módulo de inventario.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Marca</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Descripción</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Categoría</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm({ ...form, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Precio</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Costo</Label>
                <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Stock mínimo</Label>
                <Input
                  type="number"
                  value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stock máximo</Label>
                <Input
                  type="number"
                  value={form.max_stock}
                  onChange={(e) => setForm({ ...form, max_stock: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!form?.name || !form?.sku || save.isPending}
              onClick={() => form && save.mutate(form)}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
