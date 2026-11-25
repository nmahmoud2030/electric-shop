"use server";

import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money, moneyAdd, moneyMul } from "@/lib/money-server";
import { assertCan } from "@/lib/permissions";
import { applyStockChange, getNextSaleNumber } from "@/lib/stock";

const lineSchema = z.object({
  productId: z.string(),
  qty: z.number().positive(),
  unitPrice: z.number().nonnegative().optional(),
  priceOverridden: z.boolean().optional(),
});

const completeSaleSchema = z.object({
  lines: z.array(lineSchema).min(1),
  payments: z
    .array(
      z.object({
        method: z.nativeEnum(PaymentMethod),
        amount: z.number().positive(),
      }),
    )
    .min(1),
  customerId: z.string().optional().nullable(),
  useWholesale: z.boolean().optional(),
  terminalId: z.string().optional(),
});

export async function completeSale(input: z.infer<typeof completeSaleSchema>) {
  const session = await requireRole("ADMIN", "CASHIER");
  assertCan(session.user.role, "pos:sell");

  const data = completeSaleSchema.parse(input);

  if (data.payments.some((p) => p.method === "CREDIT") && !data.customerId) {
    throw new Error("Select a customer for credit sales.");
  }

  const hasOverride = data.lines.some((l) => l.priceOverridden);
  if (hasOverride) {
    assertCan(session.user.role, "pos:price_override");
  }

  const openShift = await prisma.cashShift.findFirst({
    where: { cashierId: session.user.id, closedAt: null },
    orderBy: { openedAt: "desc" },
  });

  const sale = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: data.lines.map((l) => l.productId) } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = money(0);
    const itemRows = data.lines.map((line) => {
      const product = byId.get(line.productId);
      if (!product || !product.active) {
        throw new Error("Product not found or inactive.");
      }
      const catalogPrice = data.useWholesale
        ? product.wholesalePrice
        : product.retailPrice;
      const unitPrice =
        line.priceOverridden && line.unitPrice != null
          ? money(line.unitPrice)
          : money(catalogPrice);
      const lineTotal = moneyMul(unitPrice, line.qty);
      subtotal = moneyAdd(subtotal, lineTotal);
      return {
        product,
        qty: money(line.qty),
        unitPrice,
        lineTotal,
        priceOverridden: Boolean(line.priceOverridden),
      };
    });

    const total = subtotal;
    const paid = data.payments.reduce(
      (s, p) => moneyAdd(s, p.amount),
      money(0),
    );

    if (paid.gt(total) && !data.payments.every((p) => p.method === "CASH")) {
      // allow cash overpay for change; card/credit should not exceed
    }

    const creditAmount = data.payments
      .filter((p) => p.method === "CREDIT")
      .reduce((s, p) => moneyAdd(s, p.amount), money(0));

    if (creditAmount.gt(0) && data.customerId) {
      const customer = await tx.customer.findUniqueOrThrow({
        where: { id: data.customerId },
      });
      const nextBalance = money(customer.balance).plus(creditAmount);
      if (nextBalance.gt(customer.creditLimit)) {
        throw new Error("Credit limit exceeded for this customer.");
      }
    }

    const nonCreditPaid = data.payments
      .filter((p) => p.method !== "CREDIT")
      .reduce((s, p) => moneyAdd(s, p.amount), money(0));
    const effectivePaid = moneyAdd(nonCreditPaid, creditAmount);
    // For cash, tendered may exceed total — cap recognition at total for status
    const recognized = DecimalMin(effectivePaid, total);

    let paymentStatus: "PAID" | "PARTIAL" | "UNPAID" = "UNPAID";
    if (recognized.gte(total)) paymentStatus = "PAID";
    else if (recognized.gt(0)) paymentStatus = "PARTIAL";

    const saleNumber = await getNextSaleNumber();

    const created = await tx.sale.create({
      data: {
        saleNumber,
        status: "COMPLETED",
        paymentStatus,
        cashierId: session.user.id,
        customerId: data.customerId || null,
        cashShiftId: openShift?.id,
        terminalId: data.terminalId || "T1",
        subtotal,
        total,
        completedAt: new Date(),
        items: {
          create: itemRows.map((row) => ({
            productId: row.product.id,
            nameSnapshot: row.product.nameEn,
            barcodeSnapshot: row.product.barcode,
            uomSnapshot: row.product.uom,
            unitPrice: row.unitPrice,
            qty: row.qty,
            lineTotal: row.lineTotal,
            costSnapshot: row.product.costPrice,
            priceOverridden: row.priceOverridden,
          })),
        },
        payments: {
          create: data.payments.map((p) => ({
            method: p.method,
            amount: money(p.amount),
            createdById: session.user.id,
            customerId: data.customerId || null,
          })),
        },
      },
      include: { items: true, payments: true },
    });

    for (const row of itemRows) {
      await applyStockChange(tx, {
        productId: row.product.id,
        type: "SALE",
        qtyDelta: money(row.qty).neg(),
        unitCost: row.product.costPrice,
        refType: "SALE",
        refId: created.id,
        createdById: session.user.id,
      });
    }

    if (creditAmount.gt(0) && data.customerId) {
      const customer = await tx.customer.findUniqueOrThrow({
        where: { id: data.customerId },
      });
      const nextBalance = money(customer.balance).plus(creditAmount);
      await tx.customer.update({
        where: { id: customer.id },
        data: { balance: nextBalance },
      });
      await tx.customerLedger.create({
        data: {
          customerId: customer.id,
          type: "SALE",
          amount: creditAmount,
          balanceAfter: nextBalance,
          refType: "SALE",
          refId: created.id,
          note: `Sale ${created.saleNumber}`,
        },
      });
    }

    return created;
  });

  revalidatePath("/pos");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");

  return {
    ok: true as const,
    sale: {
      id: sale.id,
      saleNumber: sale.saleNumber,
      total: sale.total.toString(),
      items: sale.items.map((i) => ({
        name: i.nameSnapshot,
        qty: i.qty.toString(),
        unitPrice: i.unitPrice.toString(),
        lineTotal: i.lineTotal.toString(),
        uom: i.uomSnapshot,
      })),
      payments: sale.payments.map((p) => ({
        method: p.method,
        amount: p.amount.toString(),
      })),
    },
  };
}

function DecimalMin(a: ReturnType<typeof money>, b: ReturnType<typeof money>) {
  return a.lt(b) ? a : b;
}

export async function openShift(openingCash: number) {
  const session = await requireRole("ADMIN", "CASHIER");
  const existing = await prisma.cashShift.findFirst({
    where: { cashierId: session.user.id, closedAt: null },
  });
  if (existing) return { ok: true as const, shiftId: existing.id };

  const shift = await prisma.cashShift.create({
    data: {
      cashierId: session.user.id,
      openingCash: money(openingCash),
    },
  });
  revalidatePath("/pos");
  return { ok: true as const, shiftId: shift.id };
}

export async function closeShift(closingCash: number) {
  const session = await requireRole("ADMIN", "CASHIER");
  const shift = await prisma.cashShift.findFirst({
    where: { cashierId: session.user.id, closedAt: null },
    include: {
      sales: { include: { payments: true } },
    },
  });
  if (!shift) throw new Error("No open shift.");

  const cashSales = shift.sales
    .flatMap((s) => s.payments)
    .filter((p) => p.method === "CASH")
    .reduce((sum, p) => moneyAdd(sum, p.amount), money(0));

  const expected = money(shift.openingCash).plus(cashSales);

  await prisma.cashShift.update({
    where: { id: shift.id },
    data: {
      closedAt: new Date(),
      closingCash: money(closingCash),
      expectedCash: expected,
    },
  });

  revalidatePath("/pos");
  return {
    ok: true as const,
    expected: expected.toString(),
    closing: money(closingCash).toString(),
  };
}

export async function holdSale(input: {
  name: string;
  lines: z.infer<typeof lineSchema>[];
  customerId?: string | null;
  useWholesale?: boolean;
}) {
  const session = await requireRole("ADMIN", "CASHIER");
  assertCan(session.user.role, "pos:sell");

  const saleNumber = await getNextSaleNumber();
  const products = await prisma.product.findMany({
    where: { id: { in: input.lines.map((l) => l.productId) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotal = money(0);
  const items = input.lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw new Error("Product not found");
    const unitPrice = money(
      input.useWholesale ? product.wholesalePrice : product.retailPrice,
    );
    const lineTotal = moneyMul(unitPrice, line.qty);
    subtotal = moneyAdd(subtotal, lineTotal);
    return {
      productId: product.id,
      nameSnapshot: product.nameEn,
      barcodeSnapshot: product.barcode,
      uomSnapshot: product.uom,
      unitPrice,
      qty: money(line.qty),
      lineTotal,
      costSnapshot: product.costPrice,
    };
  });

  const sale = await prisma.sale.create({
    data: {
      saleNumber,
      status: "HELD",
      paymentStatus: "UNPAID",
      cashierId: session.user.id,
      customerId: input.customerId || null,
      heldName: input.name || `Hold ${saleNumber}`,
      subtotal,
      total: subtotal,
      items: { create: items },
    },
  });

  revalidatePath("/pos");
  return { ok: true as const, saleId: sale.id };
}

export async function getHeldSales() {
  await requireRole("ADMIN", "CASHIER");
  const sales = await prisma.sale.findMany({
    where: { status: "HELD" },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return sales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    heldName: s.heldName,
    total: s.total.toString(),
    items: s.items.map((i) => ({
      productId: i.productId,
      name: i.nameSnapshot,
      qty: i.qty.toString(),
      unitPrice: i.unitPrice.toString(),
      uom: i.uomSnapshot,
      barcode: i.barcodeSnapshot,
    })),
  }));
}

export async function voidHeldSale(saleId: string) {
  await requireRole("ADMIN", "CASHIER");
  await prisma.sale.update({
    where: { id: saleId },
    data: { status: "VOID" },
  });
  revalidatePath("/pos");
  return { ok: true as const };
}
