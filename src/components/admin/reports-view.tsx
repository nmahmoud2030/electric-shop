"use client";

import { useLocale } from "@/components/locale-provider";

export function ReportsView({
  total,
  salesCount,
  byCashier,
  sales,
}: {
  total: string;
  salesCount: number;
  byCashier: { name: string; total: string; count: number }[];
  sales: { id: string; saleNumber: string; cashier: string; when: string; total: string }[];
}) {
  const { t, money } = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{t("reports")}</h1>
        <p className="text-[var(--muted)]">{t("reportsHint")}</p>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <p className="text-sm text-[var(--muted)]">{t("periodTotal")}</p>
        <p className="font-display text-4xl font-semibold">{money(total)}</p>
        <p className="text-sm text-[var(--muted)]">
          {salesCount} {t("completedSales")}
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="font-display text-xl font-semibold">{t("byCashier")}</h2>
        <ul className="mt-4 divide-y divide-[var(--line)]">
          {byCashier.map((c) => (
            <li key={c.name} className="flex justify-between py-3 text-sm">
              <span>
                {c.name} · {c.count} {t("salesCount")}
              </span>
              <span className="font-medium">{money(c.total)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface-2)] text-start text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">{t("saleNumber")}</th>
              <th className="px-4 py-3">{t("cashier")}</th>
              <th className="px-4 py-3">{t("when")}</th>
              <th className="px-4 py-3">{t("total")}</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 font-mono text-xs">{s.saleNumber}</td>
                <td className="px-4 py-3">{s.cashier}</td>
                <td className="px-4 py-3">{s.when}</td>
                <td className="px-4 py-3 font-medium">{money(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
