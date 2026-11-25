"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function AdminDashboardView({
  todayTotal,
  todayCount,
  productCount,
  lowStock,
  unpaidCredit,
}: {
  todayTotal: string;
  todayCount: number;
  productCount: number;
  lowStock: { id: string; nameEn: string; nameAr: string; qty: string; min: string }[];
  unpaidCredit: { id: string; name: string; balance: string }[];
}) {
  const { t, name, money } = useLocale();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("dashboard")}
          </h1>
          <p className="mt-1 text-[var(--muted)]">{t("dashboardHint")}</p>
        </div>
        <Link href="/admin/products/new">
          <Button size="lg">{t("addProduct")}</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title={t("todaySales")} value={money(todayTotal)} hint={`${todayCount} ${t("tickets")}`} />
        <Stat title={t("activeProducts")} value={String(productCount)} hint={t("inCatalog")} />
        <Stat title={t("lowStock")} value={String(lowStock.length)} hint={t("needReorder")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="font-display text-xl font-semibold">{t("lowStock")}</h2>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">{t("allStockOk")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{name(p.nameEn, p.nameAr)}</span>
                  <span className="font-medium text-amber-700">
                    {p.qty} / min {p.min}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="font-display text-xl font-semibold">{t("customerCredit")}</h2>
          {unpaidCredit.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">{t("noBalances")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {unpaidCredit.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{c.name}</span>
                  <span className="font-medium">{money(c.balance)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-sm text-[var(--muted)]">{title}</p>
      <p className="font-display mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
    </div>
  );
}
