"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  nameEn: string;
  nameAr: string;
  barcode: string;
  retailPrice: string;
  wholesalePrice: string;
  qtyOnHand: string;
  uom: string;
};

export function ProductsList({ products }: { products: Row[] }) {
  const { t, name, money } = useLocale();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("products")}</h1>
          <p className="text-[var(--muted)]">{t("productsHint")}</p>
        </div>
        <Link href="/admin/products/new">
          <Button size="lg">{t("addProduct")}</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center">
          <p className="text-[var(--muted)]">{t("noProducts")}</p>
          <Link href="/admin/products/new" className="mt-4 inline-block">
            <Button>{t("addProduct")}</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-start text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">{t("name")}</th>
                <th className="px-4 py-3">{t("barcode")}</th>
                <th className="px-4 py-3">{t("retail")}</th>
                <th className="px-4 py-3">{t("wholesale")}</th>
                <th className="px-4 py-3">{t("stock")}</th>
                <th className="px-4 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{name(p.nameEn, p.nameAr)}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.barcode}</td>
                  <td className="px-4 py-3">{money(p.retailPrice)}</td>
                  <td className="px-4 py-3">{money(p.wholesalePrice)}</td>
                  <td className="px-4 py-3">
                    {p.qtyOnHand} {p.uom.toLowerCase()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/products/${p.id}`}>
                        <Button variant="secondary" size="sm">
                          {t("edit")}
                        </Button>
                      </Link>
                      <Link href={`/admin/products/${p.id}/label`}>
                        <Button variant="ghost" size="sm">
                          {t("label")}
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
