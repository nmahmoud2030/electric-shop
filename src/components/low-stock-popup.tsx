"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export type LowStockItem = {
  id: string;
  nameEn: string;
  nameAr: string;
  qty: string;
  min: string;
};

const STORAGE_KEY = "es-low-stock-dismissed";

export function LowStockPopup({
  items,
  showProductsLink = true,
}: {
  items: LowStockItem[];
  showProductsLink?: boolean;
}) {
  const { t, name } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;

    const fingerprint = items
      .map((i) => `${i.id}:${i.qty}`)
      .sort()
      .join("|");

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { fingerprint?: string; at?: number };
        // Re-show if stock list changed, or after 1 hour
        const fresh = Date.now() - (parsed.at || 0) < 60 * 60 * 1000;
        if (parsed.fingerprint === fingerprint && fresh) return;
      }
    } catch {
      // ignore
    }

    setOpen(true);
  }, [items]);

  function dismiss() {
    const fingerprint = items
      .map((i) => `${i.id}:${i.qty}`)
      .sort()
      .join("|");
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fingerprint, at: Date.now() }),
    );
    setOpen(false);
  }

  if (!open || items.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="low-stock-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-amber-200 bg-[var(--surface)] shadow-xl">
        <div className="bg-amber-50 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            {items.length} {t("lowStockCount")}
          </p>
          <h2
            id="low-stock-title"
            className="font-display mt-1 text-2xl font-semibold text-amber-950"
          >
            {t("lowStockAlertTitle")}
          </h2>
          <p className="mt-2 text-sm text-amber-900/80">{t("lowStockAlertHint")}</p>
        </div>

        <ul className="max-h-64 overflow-y-auto divide-y divide-[var(--line)] px-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="font-medium text-[var(--ink)]">
                {name(item.nameEn, item.nameAr)}
              </span>
              <span className="shrink-0 text-amber-800">
                {t("lowStockQty")}: <strong>{item.qty}</strong>
                <span className="mx-1 text-[var(--muted)]">·</span>
                {t("lowStockMin")}: {item.min}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--line)] bg-[var(--surface-2)] px-6 py-4">
          {showProductsLink ? (
            <Link href="/admin/products" onClick={dismiss}>
              <Button variant="secondary">{t("viewProducts")}</Button>
            </Link>
          ) : null}
          <Button onClick={dismiss}>{t("dismissAlert")}</Button>
        </div>
      </div>
    </div>
  );
}
