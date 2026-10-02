/**
 * Definición ÚNICA de "ventas" en AURA AI.
 *
 * Ventas del mes = suma de `orders.total` (IVA incluido) de los pedidos con estado
 * confirmado, preparando, enviado o entregado, cuya fecha de creación cae dentro del
 * MES CALENDARIO actual (desde el día 1 a las 00:00 UTC).
 *
 * La usan Dashboard, Pedidos, Reportes, el Asistente AURA y el informe ejecutivo.
 */
export const BILLED_STATUSES = ["confirmado", "preparando", "enviado", "entregado"] as const;

export const isBilled = (status: string) =>
  (BILLED_STATUSES as readonly string[]).includes(status);

export function currentMonthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

type OrderLike = { status: string; total: number | string; created_at: string };

export function billedOrdersSince<T extends OrderLike>(orders: T[], since: Date) {
  return orders.filter((o) => isBilled(o.status) && new Date(o.created_at) >= since);
}

export function monthSales(orders: OrderLike[]) {
  return billedOrdersSince(orders, currentMonthStart()).reduce((a, o) => a + Number(o.total), 0);
}
