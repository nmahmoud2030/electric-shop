"use client";

import { useLocale } from "@/components/locale-provider";

export function ProductPageHeader({ mode }: { mode: "new" | "edit" }) {
  const { t } = useLocale();
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">
        {mode === "new" ? t("addProduct") : t("editProduct")}
      </h1>
      <p className="text-[var(--muted)]">
        {mode === "new" ? t("addProductHint") : t("editProductHint")}
      </p>
    </div>
  );
}
