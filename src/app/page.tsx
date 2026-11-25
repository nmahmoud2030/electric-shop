import { prisma } from "@/lib/db";
import { StoreHome } from "@/components/store/store-home";

export default async function StoreHomePage() {
  const [settings, categories, products] = await Promise.all([
    prisma.shopSettings.findUnique({ where: { id: "default" } }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { nameEn: "asc" },
      take: 24,
    }),
  ]);

  return (
    <StoreHome
      shopNameEn={settings?.nameEn || "Electric Shop"}
      shopNameAr={settings?.nameAr || "محل الكهرباء"}
      categories={categories.map((c) => ({
        id: c.id,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
      }))}
      products={products.map((p) => ({
        id: p.id,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        retailPrice: p.retailPrice.toString(),
        qtyOnHand: p.qtyOnHand.toString(),
        uom: p.uom,
        categoryId: p.categoryId,
        category: p.category
          ? { nameEn: p.category.nameEn, nameAr: p.category.nameAr }
          : null,
      }))}
    />
  );
}
