import { prisma } from "@/lib/db";
import { money } from "@/lib/money-server";
import type { LowStockItem } from "@/components/low-stock-popup";

export async function getLowStockItems(): Promise<LowStockItem[]> {
  const products = await prisma.product.findMany({
    where: { active: true, trackStock: true },
    orderBy: { qtyOnHand: "asc" },
  });

  return products
    .filter((p) => money(p.qtyOnHand).lte(p.minStock))
    .map((p) => ({
      id: p.id,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      qty: p.qtyOnHand.toString(),
      min: p.minStock.toString(),
    }));
}
