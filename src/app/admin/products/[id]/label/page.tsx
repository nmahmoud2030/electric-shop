import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BarcodeLabel } from "@/components/print/barcode-label";

export default async function ProductLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <BarcodeLabel
      name={product.nameEn}
      nameAr={product.nameAr}
      barcode={product.barcode}
      price={product.retailPrice.toString()}
    />
  );
}
