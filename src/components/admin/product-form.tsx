"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProduct, updateProduct } from "@/app/actions/products";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { id: string; nameEn: string; nameAr: string };
type ProductValues = {
  id?: string;
  nameEn: string;
  nameAr: string;
  brand?: string | null;
  categoryId?: string | null;
  uom: string;
  retailPrice: string;
  wholesalePrice: string;
  costPrice: string;
  qtyOnHand?: string;
  minStock: string;
  barcode?: string;
  sku?: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
};

export function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: ProductValues;
}) {
  const router = useRouter();
  const { t, name } = useLocale();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial?.id);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      if (isEdit && initial?.id) {
        await updateProduct(initial.id, formData);
      } else {
        await createProduct(formData);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setLoading(false);
    }
  }

  return (
    <form
      action={onSubmit}
      className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("nameEn")} name="nameEn" defaultValue={initial?.nameEn} required />
        <Field label={t("nameAr")} name="nameAr" defaultValue={initial?.nameAr} required />
      </div>
      <Field label={t("brand")} name="brand" defaultValue={initial?.brand || ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm text-[var(--muted)]">{t("category")}</span>
          <select
            name="categoryId"
            defaultValue={initial?.categoryId || ""}
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3"
          >
            <option value="">{t("none")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {name(c.nameEn, c.nameAr)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-[var(--muted)]">{t("unit")}</span>
          <select
            name="uom"
            defaultValue={initial?.uom || "PIECE"}
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3"
          >
            <option value="PIECE">{t("piece")}</option>
            <option value="METER">{t("meter")}</option>
            <option value="BOX">{t("box")}</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label={t("retailPrice")}
          name="retailPrice"
          type="number"
          step="0.01"
          defaultValue={initial?.retailPrice || "0"}
          required
        />
        <Field
          label={t("wholesalePrice")}
          name="wholesalePrice"
          type="number"
          step="0.01"
          defaultValue={initial?.wholesalePrice || "0"}
          required
        />
        <Field
          label={t("costPrice")}
          name="costPrice"
          type="number"
          step="0.01"
          defaultValue={initial?.costPrice || "0"}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {!isEdit ? (
          <Field
            label={t("openingStock")}
            name="qtyOnHand"
            type="number"
            step="0.01"
            defaultValue="0"
          />
        ) : null}
        <Field
          label={t("minStock")}
          name="minStock"
          type="number"
          step="0.01"
          defaultValue={initial?.minStock || "0"}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("barcodeOptional")}
          name="barcode"
          defaultValue={initial?.barcode || ""}
        />
        {!isEdit ? (
          <Field label={t("skuOptional")} name="sku" defaultValue="" />
        ) : (
          <Field label={t("sku")} name="sku" defaultValue={initial?.sku || ""} readOnly />
        )}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2 pt-2">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? t("saving") : t("save")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <Input {...rest} />
    </label>
  );
}
