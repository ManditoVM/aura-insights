/**
 * Motor analítico determinista de AURA.
 *
 * Todo lo que se calcula aquí son CÁLCULOS sobre datos reales de la base de
 * datos (no son respuestas generadas por un modelo de lenguaje). La capa
 * generativa recibe estos resultados y solo los redacta o prioriza.
 */

export type SaleRow = {
  product_id: string;
  quantity: number;
  created_at: string;
  line_total: number;
};

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  stock: number;
  min_stock: number;
  max_stock: number;
  price: number;
  cost: number;
  category_id: string | null;
};

const DAY = 86_400_000;

export const dayKey = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

export function dailySeries(sales: SaleRow[], days: number, productId?: string) {
  const start = new Date(Date.now() - (days - 1) * DAY);
  start.setHours(0, 0, 0, 0);
  const buckets = new Map<string, { units: number; revenue: number }>();
  for (let i = 0; i < days; i++) {
    buckets.set(dayKey(new Date(start.getTime() + i * DAY)), { units: 0, revenue: 0 });
  }
  for (const s of sales) {
    if (productId && s.product_id !== productId) continue;
    const key = dayKey(s.created_at);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.units += s.quantity;
    bucket.revenue += Number(s.line_total);
  }
  return [...buckets.entries()].map(([date, v]) => ({ date, ...v }));
}

/** Regresión lineal simple por mínimos cuadrados sobre la serie diaria. */
export function linearRegression(values: number[]) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, r2: 0 };
  const xs = values.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (values[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i];
    ssTot += (values[i] - my) ** 2;
    ssRes += (values[i] - pred) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
  return { slope, intercept, r2 };
}

export type ProductMetrics = {
  product: ProductRow;
  soldLast30: number;
  soldLast7: number;
  avgDaily: number;
  trend: "creciente" | "estable" | "decreciente";
  slope: number;
  daysToStockout: number | null;
  forecast7: number;
  confidence: number;
  lastSaleAt: string | null;
  stockValue: number;
  risk: "critico" | "alto" | "medio" | "bajo";
  lowRotation: boolean;
};

export function computeProductMetrics(products: ProductRow[], sales: SaleRow[]): ProductMetrics[] {
  const now = Date.now();
  return products.map((product) => {
    const own = sales.filter((s) => s.product_id === product.id);
    const soldLast30 = own
      .filter((s) => now - new Date(s.created_at).getTime() <= 30 * DAY)
      .reduce((a, s) => a + s.quantity, 0);
    const soldLast7 = own
      .filter((s) => now - new Date(s.created_at).getTime() <= 7 * DAY)
      .reduce((a, s) => a + s.quantity, 0);
    const avgDaily = soldLast30 / 30;

    const series = dailySeries(own, 28, product.id).map((d) => d.units);
    const { slope, r2 } = linearRegression(series);
    const trend = slope > 0.06 ? "creciente" : slope < -0.06 ? "decreciente" : "estable";

    const projectedDaily = Math.max(avgDaily + slope * 3.5, 0);
    const forecast7 = Math.round(Math.max(projectedDaily * 7, soldLast7 * 0.6));
    const daysToStockout = projectedDaily > 0 ? product.stock / projectedDaily : null;

    const lastSale = own.reduce<string | null>(
      (acc, s) => (!acc || s.created_at > acc ? s.created_at : acc),
      null,
    );
    const daysSinceSale = lastSale ? (now - new Date(lastSale).getTime()) / DAY : Infinity;

    const risk: ProductMetrics["risk"] =
      product.stock === 0
        ? "critico"
        : daysToStockout !== null && daysToStockout <= 3
          ? "critico"
          : product.stock <= product.min_stock || (daysToStockout !== null && daysToStockout <= 7)
            ? "alto"
            : daysToStockout !== null && daysToStockout <= 14
              ? "medio"
              : "bajo";

    const lowRotation =
      product.stock > product.min_stock * 3 && (soldLast30 <= 2 || daysSinceSale > 21);

    return {
      product,
      soldLast30,
      soldLast7,
      avgDaily,
      trend,
      slope,
      daysToStockout,
      forecast7,
      confidence: Math.round((0.45 + r2 * 0.5) * 1000) / 1000,
      lastSaleAt: lastSale,
      stockValue: product.stock * Number(product.cost),
      risk,
      lowRotation,
    };
  });
}

export type Restock = {
  metrics: ProductMetrics;
  recommendedQty: number;
  rationale: string;
};

export function restockRecommendations(metrics: ProductMetrics[]): Restock[] {
  return metrics
    .filter((m) => m.risk === "critico" || m.risk === "alto")
    .map((m) => {
      const cover = Math.ceil(Math.max(m.forecast7 * 2, m.product.min_stock * 2));
      const recommendedQty = Math.max(
        Math.min(cover - m.product.stock, m.product.max_stock - m.product.stock),
        m.product.min_stock,
      );
      const days = m.daysToStockout;
      return {
        metrics: m,
        recommendedQty: Math.ceil(recommendedQty / 5) * 5,
        rationale:
          `Stock actual ${m.product.stock} u. · venta promedio ${m.avgDaily.toFixed(1)} u/día · ` +
          (days === null
            ? "sin ventas recientes"
            : `agotamiento estimado en ${days.toFixed(1)} días`) +
          ` · demanda estimada 7 días: ${m.forecast7} u.`,
      };
    })
    .sort((a, b) => (a.metrics.daysToStockout ?? 999) - (b.metrics.daysToStockout ?? 999));
}

export type Anomaly = {
  productId: string;
  productName: string;
  date: string;
  units: number;
  mean: number;
  stdDev: number;
  zScore: number;
  direction: "alza" | "baja";
};

/** Detección de anomalías por z-score sobre la serie diaria de cada producto. */
export function detectAnomalies(products: ProductRow[], sales: SaleRow[], days = 30): Anomaly[] {
  const out: Anomaly[] = [];
  for (const product of products) {
    const series = dailySeries(sales, days, product.id);
    const units = series.map((d) => d.units);
    const active = units.filter((u) => u > 0);
    if (active.length < 5) continue;
    const mean = units.reduce((a, b) => a + b, 0) / units.length;
    const variance = units.reduce((a, b) => a + (b - mean) ** 2, 0) / units.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 0.5) continue;
    for (const point of series) {
      const z = (point.units - mean) / stdDev;
      if (Math.abs(z) >= 3 && point.units !== 0) {
        out.push({
          productId: product.id,
          productName: product.name,
          date: point.date,
          units: point.units,
          mean: Math.round(mean * 10) / 10,
          stdDev: Math.round(stdDev * 10) / 10,
          zScore: Math.round(z * 100) / 100,
          direction: z > 0 ? "alza" : "baja",
        });
      }
    }
  }
  return out.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}
