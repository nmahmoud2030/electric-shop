export type MoneyInput = number | string | { toString(): string };

/** Server-only Decimal helpers live in money-server.ts */

export function toNumber(value: MoneyInput): number {
  if (typeof value === "number") return value;
  const n = Number(typeof value === "string" ? value : value.toString());
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(
  value: MoneyInput,
  currency = "ILS",
  locale = "en",
): string {
  const n = toNumber(value);
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-IL" : "en-IL", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}
