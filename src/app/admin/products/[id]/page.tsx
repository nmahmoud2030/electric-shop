import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { ProductPageHeader } from "@/components/admin/product-page-header";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <ProductPageHeader mode="edit" />
      <ProductForm
        categories={categories.map((c) => ({
          id: c.id,
          nameEn: c.nameEn,
          nameAr: c.nameAr,
        }))}
        initial={{
          id: product.id,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          brand: product.brand,
          categoryId: product.categoryId,
          uom: product.uom,
          retailPrice: product.retailPrice.toString(),
          wholesalePrice: product.wholesalePrice.toString(),
          costPrice: product.costPrice.toString(),
          minStock: product.minStock.toString(),
          barcode: product.barcode,
          sku: product.sku,
          descriptionEn: product.descriptionEn,
          descriptionAr: product.descriptionAr,
        }}
      />
    </div>
  );
}
