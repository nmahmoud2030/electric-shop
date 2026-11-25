"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money-server";
import { assertCan } from "@/lib/permissions";
import { applyStockChange } from "@/lib/stock";

export async function createSupplier(formData: FormData) {
  const session = await requireRole("ADMIN");
  assertCan(session.user.role, "supplier:manage");

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name required");

  await prisma.supplier.create({
    data: {
      name,
      phone: String(formData.get("phone") || "") || null,
    },
  });

  revalidatePath("/admin/suppliers");
}

export async function receiveStock(formData: FormData) {
  const session = await requireRole("ADMIN");
  assertCan(session.user.role, "purchase:manage");

  const productId = String(formData.get("productId") || "");
  const qty = Number(formData.get("qty") || 0);
  const unitCost = Number(formData.get("unitCost") || 0);
  if (!productId || qty <= 0) throw new Error("Invalid receive");

  const count = await prisma.goodsReceipt.count();
  const receiptNumber = `GR-${String(count + 1).padStart(6, "0")}`;

  await prisma.$transaction(async (tx) => {
    const receipt = await tx.goodsReceipt.create({
      data: {
        receiptNumber,
        receivedById: session.user.id,
        items: {
          create: {
            productId,
            qty: money(qty),
            unitCost: money(unitCost),
          },
        },
      },
    });

    await applyStockChange(tx, {
      productId,
      type: "PURCHASE_RECEIVE",
      qtyDelta: qty,
      unitCost,
      refType: "GOODS_RECEIPT",
      refId: receipt.id,
      createdById: session.user.id,
      reason: "Stock receive",
    });

    await tx.product.update({
      where: { id: productId },
      data: { costPrice: money(unitCost) },
    });
  });

  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}
