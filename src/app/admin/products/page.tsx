import { prisma } from "@/lib/db";
import { ProductsList } from "@/components/admin/products-list";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { nameEn: "asc" },
  });

  return (
    <ProductsList
      products={products.map((p) => ({
        id: p.id,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        barcode: p.barcode,
        retailPrice: p.retailPrice.toString(),
        wholesalePrice: p.wholesalePrice.toString(),
        qtyOnHand: p.qtyOnHand.toString(),
        uom: p.uom,
      }))}
    />
  );
}
