import { prisma } from "@/lib/db";
import { SuppliersView } from "@/components/admin/suppliers-view";

export default async function SuppliersPage() {
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { nameEn: "asc" } }),
  ]);

  return (
    <SuppliersView
      suppliers={suppliers.map((s) => ({ id: s.id, name: s.name, phone: s.phone }))}
      products={products.map((p) => ({
        id: p.id,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        barcode: p.barcode,
      }))}
    />
  );
}
