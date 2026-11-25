"use client";

import { createSupplier, receiveStock } from "@/app/actions/purchasing";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SuppliersView({
  suppliers,
  products,
}: {
  suppliers: { id: string; name: string; phone: string | null }[];
  products: { id: string; nameEn: string; nameAr: string; barcode: string }[];
}) {
  const { t, name } = useLocale();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">{t("suppliersTitle")}</h1>
        <p className="text-[var(--muted)]">{t("suppliersHint")}</p>
      </div>

      <form
        action={createSupplier}
        className="flex flex-wrap gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
      >
        <Input name="name" placeholder={t("supplierName")} required className="max-w-xs" />
        <Input name="phone" placeholder={t("phone")} className="max-w-xs" />
        <Button type="submit">{t("addSupplier")}</Button>
      </form>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="font-display text-xl font-semibold">{t("quickReceive")}</h2>
        <form action={receiveStock} className="mt-4 grid gap-3 md:grid-cols-4">
          <select name="productId" required className="h-11 rounded-xl border border-[var(--line)] px-3">
            <option value="">{t("selectProduct")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {name(p.nameEn, p.nameAr)} ({p.barcode})
              </option>
            ))}
          </select>
          <Input name="qty" type="number" step="0.01" min="0.01" placeholder={t("quantity")} required />
          <Input name="unitCost" type="number" step="0.01" min="0" placeholder={t("unitCost")} required />
          <Button type="submit">{t("receive")}</Button>
        </form>
      </section>

      <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {suppliers.map((s) => (
          <li key={s.id} className="flex justify-between px-4 py-3 text-sm">
            <span className="font-medium">{s.name}</span>
            <span className="text-[var(--muted)]">{s.phone || "—"}</span>
          </li>
        ))}
        {suppliers.length === 0 ? (
          <li className="px-4 py-8 text-center text-[var(--muted)]">{t("noSuppliers")}</li>
        ) : null}
      </ul>
    </div>
  );
}
