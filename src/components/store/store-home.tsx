"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { StoreHeader } from "@/components/store/store-header";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  nameEn: string;
  nameAr: string;
  retailPrice: string;
  qtyOnHand: string;
  uom: string;
  categoryId: string | null;
  category: { nameEn: string; nameAr: string } | null;
};

type Category = { id: string; nameEn: string; nameAr: string };

export function StoreHome({
  shopNameEn,
  shopNameAr,
  categories,
  products,
}: {
  shopNameEn: string;
  shopNameAr: string;
  categories: Category[];
  products: Product[];
}) {
  const { t, locale, name, money } = useLocale();
  const shopName = locale === "ar" ? shopNameAr : shopNameEn;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter((p) => p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  return (
    <div>
      <StoreHeader shopName={shopName} />

      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f6b4c_0%,#0a4f39_45%,#1a2e28_100%)]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #fff 0.5px, transparent 0.6px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 text-white">
          <p className="font-display text-5xl font-semibold tracking-tight md:text-7xl">
            {shopName}
          </p>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            {locale === "ar" ? shopNameAr : shopNameEn} — {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#catalog"
              className="rounded-2xl bg-white px-6 py-3 text-base font-semibold text-[var(--brand-dark)]"
            >
              {t("browseCatalog")}
            </a>
            <Link
              href="/login"
              className="rounded-2xl border border-white/40 px-6 py-3 text-base font-medium text-white"
            >
              {t("staffLogin")}
            </Link>
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold">{t("catalog")}</h2>
            <p className="text-[var(--muted)]">{t("catalogHint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition",
                selectedCategoryId === null
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] font-medium text-[var(--brand-dark)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--brand)]",
              )}
            >
              {t("allCategories")}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryId(c.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  selectedCategoryId === c.id
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] font-medium text-[var(--brand-dark)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--brand)]",
                )}
              >
                {name(c.nameEn, c.nameAr)}
              </button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
            {t("productsWillAppear")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
            {t("noProductsInCategory")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--brand)]"
              >
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  {p.category
                    ? name(p.category.nameEn, p.category.nameAr)
                    : t("general")}
                </p>
                <h3 className="font-display mt-2 text-xl font-semibold">
                  {name(p.nameEn, p.nameAr)}
                </h3>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-lg font-semibold text-[var(--brand-dark)]">
                    {money(p.retailPrice)}
                    <span className="ms-1 text-xs font-normal text-[var(--muted)]">
                      / {p.uom.toLowerCase()}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {Number(p.qtyOnHand) > 0 ? t("inStock") : t("outOfStock")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
