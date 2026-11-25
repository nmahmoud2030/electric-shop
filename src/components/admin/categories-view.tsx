"use client";

import { createCategory, toggleCategoryActive } from "@/app/actions/categories";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = {
  id: string;
  nameEn: string;
  nameAr: string;
  sortOrder: number;
  active: boolean;
  productCount: number;
};

export function CategoriesView({ categories }: { categories: Row[] }) {
  const { t, name } = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{t("categories")}</h1>
        <p className="text-[var(--muted)]">{t("categoriesHint")}</p>
      </div>

      <form
        action={createCategory}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:grid-cols-4"
      >
        <Input name="nameEn" placeholder={t("categoryNameEn")} required />
        <Input name="nameAr" placeholder={t("categoryNameAr")} required />
        <Input
          name="sortOrder"
          type="number"
          placeholder={t("sortOrder")}
          defaultValue={categories.length + 1}
        />
        <Button type="submit">{t("addCategory")}</Button>
      </form>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
          {t("noCategories")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-start text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">{t("name")}</th>
                <th className="px-4 py-3">{t("sortOrder")}</th>
                <th className="px-4 py-3">{t("products")}</th>
                <th className="px-4 py-3">{t("active")}</th>
                <th className="px-4 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3 font-medium">{name(c.nameEn, c.nameAr)}</td>
                  <td className="px-4 py-3">{c.sortOrder}</td>
                  <td className="px-4 py-3">{c.productCount}</td>
                  <td className="px-4 py-3">{c.active ? "✓" : "—"}</td>
                  <td className="px-4 py-3">
                    <form action={toggleCategoryActive.bind(null, c.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        {c.active ? t("deactivate") : t("activate")}
                      </Button>
                    </form>
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
