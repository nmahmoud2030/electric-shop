import { prisma } from "@/lib/db";
import { money } from "@/lib/money-server";
import { AdminDashboardView } from "@/components/admin/admin-dashboard";

export default async function AdminDashboard() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [todaySales, lowStock, productCount, unpaidCredit] = await Promise.all([
    prisma.sale.findMany({
      where: { status: "COMPLETED", completedAt: { gte: start } },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { qtyOnHand: "asc" },
      take: 50,
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.customer.findMany({
      where: { balance: { gt: 0 } },
      orderBy: { balance: "desc" },
      take: 5,
    }),
  ]);

  const todayTotal = todaySales.reduce((s, sale) => s.plus(sale.total), money(0));
  const low = lowStock.filter((p) => money(p.qtyOnHand).lte(p.minStock));

  return (
    <AdminDashboardView
      todayTotal={todayTotal.toString()}
      todayCount={todaySales.length}
      productCount={productCount}
      lowStock={low.map((p) => ({
        id: p.id,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        qty: p.qtyOnHand.toString(),
        min: p.minStock.toString(),
      }))}
      unpaidCredit={unpaidCredit.map((c) => ({
        id: c.id,
        name: c.name,
        balance: c.balance.toString(),
      }))}
    />
  );
}
