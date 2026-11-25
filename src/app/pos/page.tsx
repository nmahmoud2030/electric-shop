import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LowStockPopup } from "@/components/low-stock-popup";
import { PosTerminal } from "@/components/pos/pos-terminal";
import { getLowStockItems } from "@/lib/low-stock";

export default async function PosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/pos");
  if (session.user.role !== "ADMIN" && session.user.role !== "CASHIER") {
    redirect("/");
  }

  const [settings, customers, openShift, lowStock] = await Promise.all([
    prisma.shopSettings.findUnique({ where: { id: "default" } }),
    prisma.customer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isContractor: true },
    }),
    prisma.cashShift.findFirst({
      where: { cashierId: session.user.id, closedAt: null },
    }),
    getLowStockItems(),
  ]);

  return (
    <>
      <PosTerminal
        cashierName={session.user.name}
        role={session.user.role}
        shopNameEn={settings?.nameEn || "Electric Shop"}
        shopNameAr={settings?.nameAr || "محل الكهرباء"}
        footerEn={settings?.receiptFooterEn || "Thank you"}
        footerAr={settings?.receiptFooterAr || "شكراً"}
        customers={customers}
        initialShiftOpen={Boolean(openShift)}
      />
      <LowStockPopup
        items={lowStock}
        showProductsLink={session.user.role === "ADMIN"}
      />
    </>
  );
}

