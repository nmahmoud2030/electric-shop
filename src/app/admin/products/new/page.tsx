import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { ProductPageHeader } from "@/components/admin/product-page-header";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-6">
      <ProductPageHeader mode="new" />
      <ProductForm
        categories={categories.map((c) => ({
          id: c.id,
          nameEn: c.nameEn,
          nameAr: c.nameAr,
        }))}
      />
    </div>
  );
}
