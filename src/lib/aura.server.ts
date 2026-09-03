/**
 * Cliente del gateway de IA de Lovable + construcción del "context pack"
 * empresarial que se entrega al modelo. Solo se ejecuta en el servidor.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeProductMetrics,
  detectAnomalies,
  restockRecommendations,
  dailySeries,
  type ProductRow,
  type SaleRow,
} from "./analytics";

export const AI_MODEL = "google/gemini-3.7-flash";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: unknown;
};

export async function callGateway(body: Record<string, unknown>) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Falta la configuración del servicio de IA (LOVABLE_API_KEY).");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: AI_MODEL, ...body }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429)
      throw new Error("Límite de solicitudes de IA alcanzado. Intenta de nuevo en unos segundos.");
    if (res.status === 402)
      throw new Error("Se agotaron los créditos de IA del espacio de trabajo.");
    if (res.status === 403) throw new Error("El acceso a la IA está bloqueado por política del espacio de trabajo.");
    throw new Error(`Error del servicio de IA (${res.status}): ${text.slice(0, 300)}`);
  }

  return (await res.json()) as {
    choices: { message: { content: string | null; tool_calls?: ToolCall[] } }[];
  };
}

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

/** Snapshot compacto y REAL de la operación, calculado en el servidor. */
export async function buildContextPack(supabase: SupabaseClient) {
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();

  const [{ data: products }, { data: items }, { data: orders }, { data: customers }] =
    await Promise.all([
      supabase.from("products").select("id,sku,name,stock,min_stock,max_stock,price,cost,category_id"),
      supabase
        .from("order_items")
        .select("product_id,quantity,line_total,created_at,orders!inner(status)")
        .gte("created_at", since)
        .not("orders.status", "in", "(cancelado,pendiente)")
        .limit(5000),
      supabase.from("orders").select("id,code,status,total,created_at,customer_id").gte("created_at", since),
      supabase.from("customers").select("id,first_name,last_name,email"),
    ]);

  const productRows = (products ?? []).map((p) => ({
    ...p,
    price: Number(p.price),
    cost: Number(p.cost),
  })) as ProductRow[];

  const sales: SaleRow[] = (items ?? []).map((r) => ({
    product_id: r.product_id,
    quantity: r.quantity,
    line_total: Number(r.line_total),
    created_at: r.created_at,
  }));

  const metrics = computeProductMetrics(productRows, sales);
  const restock = restockRecommendations(metrics);
  const anomalies = detectAnomalies(productRows, sales);
  const series = dailySeries(sales, 30);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const salesMonth = (orders ?? [])
    .filter((o) => !["cancelado", "pendiente"].includes(o.status) && new Date(o.created_at) >= monthStart)
    .reduce((a, o) => a + Number(o.total), 0);

  const byCustomer = new Map<string, number>();
  for (const o of orders ?? []) {
    if (["cancelado", "pendiente"].includes(o.status)) continue;
    byCustomer.set(o.customer_id, (byCustomer.get(o.customer_id) ?? 0) + Number(o.total));
  }
  const topCustomers = [...byCustomer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, total]) => {
      const c = (customers ?? []).find((x) => x.id === id);
      return { nombre: c ? `${c.first_name} ${c.last_name}`.trim() : "Desconocido", total_comprado: Math.round(total) };
    });

  return {
    generado_en: new Date().toISOString(),
    kpis: {
      ventas_mes_actual: Math.round(salesMonth),
      pedidos_pendientes: (orders ?? []).filter((o) => o.status === "pendiente").length,
      clientes_registrados: (customers ?? []).length,
      productos_activos: productRows.length,
      productos_bajo_minimo: productRows.filter((p) => p.stock <= p.min_stock).length,
      valor_inventario: Math.round(metrics.reduce((a, m) => a + m.stockValue, 0)),
    },
    ventas_diarias_30d: series.map((s) => ({ fecha: s.date, unidades: s.units, ingreso: Math.round(s.revenue) })),
    top_vendidos: [...metrics]
      .sort((a, b) => b.soldLast30 - a.soldLast30)
      .slice(0, 8)
      .map((m) => ({ producto: m.product.name, sku: m.product.sku, unidades_30d: m.soldLast30, stock: m.product.stock })),
    riesgo_agotamiento: metrics
      .filter((m) => m.risk === "critico" || m.risk === "alto")
      .slice(0, 10)
      .map((m) => ({
        producto: m.product.name,
        sku: m.product.sku,
        stock: m.product.stock,
        venta_promedio_diaria: Number(m.avgDaily.toFixed(2)),
        dias_estimados_restantes: m.daysToStockout === null ? null : Number(m.daysToStockout.toFixed(1)),
        riesgo: m.risk,
      })),
    baja_rotacion: metrics
      .filter((m) => m.lowRotation)
      .slice(0, 8)
      .map((m) => ({ producto: m.product.name, stock: m.product.stock, unidades_30d: m.soldLast30 })),
    recomendaciones_abastecimiento: restock.slice(0, 8).map((r) => ({
      producto: r.metrics.product.name,
      sku: r.metrics.product.sku,
      cantidad_recomendada: r.recommendedQty,
      justificacion: r.rationale,
    })),
    anomalias: anomalies.slice(0, 6).map((a) => ({
      producto: a.productName,
      fecha: a.date,
      unidades: a.units,
      promedio: a.mean,
      z_score: a.zScore,
      direccion: a.direction,
    })),
    prediccion_demanda_7d: [...metrics]
      .sort((a, b) => b.forecast7 - a.forecast7)
      .slice(0, 8)
      .map((m) => ({
        producto: m.product.name,
        demanda_estimada: m.forecast7,
        tendencia: m.trend,
        confianza: m.confidence,
      })),
    top_clientes: topCustomers,
  };
}
