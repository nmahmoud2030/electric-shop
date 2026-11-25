import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { LowStockPopup } from "@/components/low-stock-popup";
import { getLowStockItems } from "@/lib/low-stock";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/pos");

  const lowStock = await getLowStockItems();

  return (
    <div className="min-h-screen">
      <AdminNav userName={session.user.name} />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <LowStockPopup items={lowStock} showProductsLink />
    </div>
  );
}
