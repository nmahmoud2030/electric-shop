import type { Prisma, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { money, type MoneyInput } from "@/lib/money-server";

type Tx = Prisma.TransactionClient;

export async function applyStockChange(
  tx: Tx,
  input: {
    productId: string;
    type: StockMovementType;
    qtyDelta: MoneyInput;
    unitCost?: MoneyInput;
    refType?: string;
    refId?: string;
    reason?: string;
    createdById?: string;
    allowNegative?: boolean;
  },
) {
  const product = await tx.product.findUniqueOrThrow({
    where: { id: input.productId },
  });

  if (!product.trackStock) {
    await tx.stockMovement.create({
      data: {
        productId: input.productId,
        type: input.type,
        qtyDelta: money(input.qtyDelta),
        unitCost: money(input.unitCost ?? 0),
        refType: input.refType,
        refId: input.refId,
        reason: input.reason,
        createdById: input.createdById,
      },
    });
    return product;
  }

  const delta = money(input.qtyDelta);
  const nextQty = money(product.qtyOnHand).plus(delta);

  if (!input.allowNegative && nextQty.isNeg()) {
    throw new Error(`Not enough stock for ${product.nameEn}. Available: ${product.qtyOnHand}`);
  }

  const updated = await tx.product.update({
    where: { id: input.productId },
    data: { qtyOnHand: nextQty },
  });

  await tx.stockMovement.create({
    data: {
      productId: input.productId,
      type: input.type,
      qtyDelta: delta,
      unitCost: money(input.unitCost ?? product.costPrice),
      refType: input.refType,
      refId: input.refId,
      reason: input.reason,
      createdById: input.createdById,
    },
  });

  return updated;
}

export async function getNextSaleNumber(): Promise<string> {
  const count = await prisma.sale.count();
  return `S-${String(count + 1).padStart(6, "0")}`;
}

export async function getNextOrderNumber(): Promise<string> {
  const count = await prisma.onlineOrder.count();
  return `O-${String(count + 1).padStart(6, "0")}`;
}

export async function getNextBarcodeAndSku() {
  const count = await prisma.product.count();
  const seq = count + 1;
  return {
    barcode: `ES${String(seq).padStart(10, "0")}`,
    sku: `SKU-${String(seq).padStart(6, "0")}`,
  };
}
