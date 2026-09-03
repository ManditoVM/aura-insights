import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  computeProductMetrics,
  detectAnomalies,
  restockRecommendations,
  type ProductRow,
  type SaleRow,
} from "@/lib/analytics";

const NINETY_DAYS_AGO = () => new Date(Date.now() - 90 * 86_400_000).toISOString();

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(first_name,last_name,email)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
}

/** Ventas efectivas (pedidos no cancelados ni pendientes) de los últimos 90 días. */
export function useSales() {
  return useQuery({
    queryKey: ["sales-90"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("product_id, quantity, line_total, created_at, orders!inner(status)")
        .gte("created_at", NINETY_DAYS_AGO())
        .not("orders.status", "in", "(cancelado,pendiente)")
        .limit(5000);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        product_id: r.product_id,
        quantity: r.quantity,
        line_total: Number(r.line_total),
        created_at: r.created_at,
      })) as SaleRow[];
    },
  });
}

export function useMovements(productId?: string) {
  return useQuery({
    queryKey: ["movements", productId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("inventory_movements")
        .select("*, products(name,sku)")
        .order("created_at", { ascending: false })
        .limit(300);
      if (productId) q = q.eq("product_id", productId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

/** Métricas derivadas: riesgo de agotamiento, rotación, predicción y anomalías. */
export function useIntelligence() {
  const products = useProducts();
  const sales = useSales();

  const productRows: ProductRow[] = (products.data ?? []).map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    stock: p.stock,
    min_stock: p.min_stock,
    max_stock: p.max_stock,
    price: Number(p.price),
    cost: Number(p.cost),
    category_id: p.category_id,
  }));

  const metrics =
    products.data && sales.data ? computeProductMetrics(productRows, sales.data) : [];

  return {
    isLoading: products.isLoading || sales.isLoading,
    products: products.data ?? [],
    sales: sales.data ?? [],
    metrics,
    restock: restockRecommendations(metrics),
    anomalies: products.data && sales.data ? detectAnomalies(productRows, sales.data) : [],
  };
}
