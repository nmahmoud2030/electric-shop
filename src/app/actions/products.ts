"use server";

import { revalidatePath } from "next/cache";
import { UnitOfMeasure } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money-server";
import { assertCan } from "@/lib/permissions";
import { getNextBarcodeAndSku } from "@/lib/stock";

const productSchema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  brand: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  uom: z.nativeEnum(UnitOfMeasure),
  retailPrice: z.coerce.number().nonnegative(),
  wholesalePrice: z.coerce.number().nonnegative(),
  costPrice: z.coerce.number().nonnegative(),
  qtyOnHand: z.coerce.number().nonnegative().optional(),
  minStock: z.coerce.number().nonnegative().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
});

export async function createProduct(formData: FormData) {
  const session = await requireRole("ADMIN");
  assertCan(session.user.role, "product:create");

  const parsed = productSchema.parse({
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    brand: formData.get("brand") || undefined,
    categoryId: formData.get("categoryId") || null,
    uom: formData.get("uom") || "PIECE",
    retailPrice: formData.get("retailPrice"),
    wholesalePrice: formData.get("wholesalePrice"),
    costPrice: formData.get("costPrice"),
    qtyOnHand: formData.get("qtyOnHand") || 0,
    minStock: formData.get("minStock") || 0,
    barcode: formData.get("barcode") || undefined,
    sku: formData.get("sku") || undefined,
    descriptionEn: formData.get("descriptionEn") || undefined,
    descriptionAr: formData.get("descriptionAr") || undefined,
  });

  const generated = await getNextBarcodeAndSku();
  const barcode = parsed.barcode?.trim() || generated.barcode;
  const sku = parsed.sku?.trim() || generated.sku;

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        nameEn: parsed.nameEn,
        nameAr: parsed.nameAr,
        brand: parsed.brand,
        categoryId: parsed.categoryId || null,
        uom: parsed.uom,
        retailPrice: money(parsed.retailPrice),
        wholesalePrice: money(parsed.wholesalePrice),
        costPrice: money(parsed.costPrice),
        qtyOnHand: money(parsed.qtyOnHand ?? 0),
        minStock: money(parsed.minStock ?? 0),
        barcode,
        sku,
        descriptionEn: parsed.descriptionEn,
        descriptionAr: parsed.descriptionAr,
      },
    });

    if ((parsed.qtyOnHand ?? 0) > 0) {
      await tx.stockMovement.create({
        data: {
          productId: created.id,
          type: "ADJUSTMENT",
          qtyDelta: money(parsed.qtyOnHand ?? 0),
          unitCost: money(parsed.costPrice),
          reason: "Initial stock",
          createdById: session.user.id,
          refType: "PRODUCT",
          refId: created.id,
        },
      });
    }

    await tx.priceHistory.create({
      data: {
        productId: created.id,
        oldRetail: money(0),
        newRetail: money(parsed.retailPrice),
        oldWholesale: money(0),
        newWholesale: money(parsed.wholesalePrice),
        oldCost: money(0),
        newCost: money(parsed.costPrice),
        changedById: session.user.id,
      },
    });

    return created;
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true as const, productId: product.id };
}

export async function updateProduct(productId: string, formData: FormData) {
  const session = await requireRole("ADMIN");
  assertCan(session.user.role, "product:edit");
  assertCan(session.user.role, "product:price");

  const parsed = productSchema.parse({
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    brand: formData.get("brand") || undefined,
    categoryId: formData.get("categoryId") || null,
    uom: formData.get("uom") || "PIECE",
    retailPrice: formData.get("retailPrice"),
    wholesalePrice: formData.get("wholesalePrice"),
    costPrice: formData.get("costPrice"),
    minStock: formData.get("minStock") || 0,
    barcode: formData.get("barcode") || undefined,
    descriptionEn: formData.get("descriptionEn") || undefined,
    descriptionAr: formData.get("descriptionAr") || undefined,
  });

  const existing = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        nameEn: parsed.nameEn,
        nameAr: parsed.nameAr,
        brand: parsed.brand,
        categoryId: parsed.categoryId || null,
        uom: parsed.uom,
        retailPrice: money(parsed.retailPrice),
        wholesalePrice: money(parsed.wholesalePrice),
        costPrice: money(parsed.costPrice),
        minStock: money(parsed.minStock ?? 0),
        barcode: parsed.barcode?.trim() || existing.barcode,
        descriptionEn: parsed.descriptionEn,
        descriptionAr: parsed.descriptionAr,
      },
    });

    const priceChanged =
      !money(existing.retailPrice).eq(parsed.retailPrice) ||
      !money(existing.wholesalePrice).eq(parsed.wholesalePrice) ||
      !money(existing.costPrice).eq(parsed.costPrice);

    if (priceChanged) {
      await tx.priceHistory.create({
        data: {
          productId,
          oldRetail: existing.retailPrice,
          newRetail: money(parsed.retailPrice),
          oldWholesale: existing.wholesalePrice,
          newWholesale: money(parsed.wholesalePrice),
          oldCost: existing.costPrice,
          newCost: money(parsed.costPrice),
          changedById: session.user.id,
        },
      });
    }
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function findProductByBarcode(barcode: string) {
  const session = await requireRole("ADMIN", "CASHIER");
  assertCan(session.user.role, "pos:sell");

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ barcode }, { sku: barcode }],
      active: true,
    },
  });

  if (!product) return { ok: false as const, error: "BARCODE_NOT_FOUND" };

  return {
    ok: true as const,
    product: {
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      barcode: product.barcode,
      sku: product.sku,
      uom: product.uom,
      retailPrice: product.retailPrice.toString(),
      wholesalePrice: product.wholesalePrice.toString(),
      costPrice: product.costPrice.toString(),
      qtyOnHand: product.qtyOnHand.toString(),
      trackStock: product.trackStock,
    },
  };
}
