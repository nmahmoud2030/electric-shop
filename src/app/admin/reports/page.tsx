import { prisma } from "@/lib/db";
import { money } from "@/lib/money-server";
import { ReportsView } from "@/components/admin/reports-view";

export default async function ReportsPage() {
  const start = new Date();
  start.setDate(start.getDate() - 7);

  const sales = await prisma.sale.findMany({
    where: { status: "COMPLETED", completedAt: { gte: start } },
    include: { cashier: true },
    orderBy: { completedAt: "desc" },
  });

  const total = sales.reduce((s, sale) => s.plus(sale.total), money(0));
  const byCashier = new Map<string, { name: string; total: ReturnType<typeof money>; count: number }>();
  for (const sale of sales) {
    const cur = byCashier.get(sale.cashierId) || {
      name: sale.cashier.name,
      total: money(0),
      count: 0,
    };
    cur.total = cur.total.plus(sale.total);
    cur.count += 1;
    byCashier.set(sale.cashierId, cur);
  }

  return (
    <ReportsView
      total={total.toString()}
      salesCount={sales.length}
      byCashier={[...byCashier.values()].map((c) => ({
        name: c.name,
        total: c.total.toString(),
        count: c.count,
      }))}
      sales={sales.map((s) => ({
        id: s.id,
        saleNumber: s.saleNumber,
        cashier: s.cashier.name,
        when: s.completedAt ? new Date(s.completedAt).toLocaleString() : "—",
        total: s.total.toString(),
      }))}
    />
  );
}
