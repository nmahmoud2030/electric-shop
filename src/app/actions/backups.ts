"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";

export async function runBackupExports() {
  const session = await requireRole("ADMIN");
  assertCan(session.user.role, "backup:manage");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const root = path.join(process.cwd(), "backups");
  const financeDir = path.join(root, "finance");
  const goodsDir = path.join(root, "goods");
  await mkdir(financeDir, { recursive: true });
  await mkdir(goodsDir, { recursive: true });

  try {
    const [sales, payments, ledgers, shifts, products, movements] =
      await Promise.all([
        prisma.sale.findMany({ include: { items: true } }),
        prisma.payment.findMany(),
        prisma.customerLedger.findMany(),
        prisma.cashShift.findMany(),
        prisma.product.findMany(),
        prisma.stockMovement.findMany(),
      ]);

    const financePath = path.join(financeDir, `finance_${stamp}.json`);
    const goodsPath = path.join(goodsDir, `goods_${stamp}.json`);

    await writeFile(
      financePath,
      JSON.stringify({ sales, payments, ledgers, shifts, exportedAt: stamp }, null, 2),
      "utf8",
    );
    await writeFile(
      goodsPath,
      JSON.stringify({ products, movements, exportedAt: stamp }, null, 2),
      "utf8",
    );

    // SQLite file copy marker
    await prisma.backupLog.create({
      data: {
        type: "FINANCE_GOODS",
        path: financePath,
        status: "OK",
        message: `Finance + goods exported (${stamp})`,
      },
    });
    await prisma.backupLog.create({
      data: {
        type: "GOODS",
        path: goodsPath,
        status: "OK",
        message: goodsPath,
      },
    });
  } catch (e) {
    await prisma.backupLog.create({
      data: {
        type: "FINANCE_GOODS",
        status: "ERROR",
        message: e instanceof Error ? e.message : "Backup failed",
      },
    });
    throw e;
  }

  revalidatePath("/admin/backups");
}
