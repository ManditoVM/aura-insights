export const currency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

export const compactCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));

export const number = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("es-MX").format(Number(value ?? 0));

export const dateTime = (value: string | Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value),
      )
    : "—";

export const dateOnly = (value: string | Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(value))
    : "—";

export const shortDate = (value: string | Date) =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(new Date(value));

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
