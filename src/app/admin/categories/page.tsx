import { prisma } from "@/lib/db";
import { CategoriesView } from "@/components/admin/categories-view";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <CategoriesView
      categories={categories.map((c) => ({
        id: c.id,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        sortOrder: c.sortOrder,
        active: c.active,
        productCount: c._count.products,
      }))}
    />
  );
}
