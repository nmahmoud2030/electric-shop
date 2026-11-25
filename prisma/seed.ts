import { PrismaClient, Role, UnitOfMeasure } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.shopSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      nameEn: "Electric Shop",
      nameAr: "محل الكهرباء",
      setupComplete: true,
    },
    update: {},
  });

  const adminHash = await hash("admin123", 10);
  const cashierHash = await hash("cashier123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@electric.shop" },
    create: {
      email: "admin@electric.shop",
      name: "Shop Admin",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
    update: { passwordHash: adminHash, role: Role.ADMIN },
  });

  await prisma.user.upsert({
    where: { email: "cashier@electric.shop" },
    create: {
      email: "cashier@electric.shop",
      name: "Cashier One",
      passwordHash: cashierHash,
      role: Role.CASHIER,
    },
    update: { passwordHash: cashierHash, role: Role.CASHIER },
  });

  const categories = [
    { slug: "hand-tools", nameEn: "Hand Tools", nameAr: "أدوات يدوية", sortOrder: 1 },
    { slug: "cables", nameEn: "Cables & Wires", nameAr: "كابلات وأسلاك", sortOrder: 2 },
    { slug: "breakers", nameEn: "Breakers & Panels", nameAr: "قواطع ولوحات", sortOrder: 3 },
    { slug: "lighting", nameEn: "Lighting", nameAr: "إضاءة", sortOrder: 4 },
    { slug: "connectors", nameEn: "Connectors & Fittings", nameAr: "وصلات وتركيبات", sortOrder: 5 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { nameEn: c.nameEn, nameAr: c.nameAr },
    });
  }

  const cables = await prisma.category.findUniqueOrThrow({ where: { slug: "cables" } });
  const tools = await prisma.category.findUniqueOrThrow({ where: { slug: "hand-tools" } });
  const breakers = await prisma.category.findUniqueOrThrow({ where: { slug: "breakers" } });

  const products = [
    {
      sku: "SKU-000001",
      barcode: "ES0000000001",
      nameEn: "Screwdriver Set 6pc",
      nameAr: "طقم مفكات 6 قطع",
      brand: "ProTool",
      categoryId: tools.id,
      uom: UnitOfMeasure.PIECE,
      retailPrice: 45,
      wholesalePrice: 38,
      costPrice: 22,
      qtyOnHand: 25,
      minStock: 5,
    },
    {
      sku: "SKU-000002",
      barcode: "ES0000000002",
      nameEn: "NYM Cable 3x2.5mm",
      nameAr: "كابل NYM 3×2.5 مم",
      brand: "CableCo",
      categoryId: cables.id,
      uom: UnitOfMeasure.METER,
      retailPrice: 4.5,
      wholesalePrice: 3.8,
      costPrice: 2.5,
      qtyOnHand: 500,
      minStock: 50,
    },
    {
      sku: "SKU-000003",
      barcode: "ES0000000003",
      nameEn: "MCB 16A Single Pole",
      nameAr: "قاطع 16 أمبير أحادي",
      brand: "SafeBreak",
      categoryId: breakers.id,
      uom: UnitOfMeasure.PIECE,
      retailPrice: 18,
      wholesalePrice: 14,
      costPrice: 9,
      qtyOnHand: 80,
      minStock: 20,
    },
    {
      sku: "SKU-000004",
      barcode: "ES0000000004",
      nameEn: "Wire Stripper",
      nameAr: "قطاع أسلاك",
      brand: "ProTool",
      categoryId: tools.id,
      uom: UnitOfMeasure.PIECE,
      retailPrice: 32,
      wholesalePrice: 27,
      costPrice: 15,
      qtyOnHand: 15,
      minStock: 5,
    },
    {
      sku: "SKU-000005",
      barcode: "ES0000000005",
      nameEn: "LED Bulb 12W",
      nameAr: "لمبة LED 12 واط",
      brand: "BrightLite",
      categoryId: (await prisma.category.findUniqueOrThrow({ where: { slug: "lighting" } })).id,
      uom: UnitOfMeasure.PIECE,
      retailPrice: 12,
      wholesalePrice: 9,
      costPrice: 5,
      qtyOnHand: 120,
      minStock: 30,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      create: p,
      update: {
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        retailPrice: p.retailPrice,
        wholesalePrice: p.wholesalePrice,
        qtyOnHand: p.qtyOnHand,
      },
    });
  }

  await prisma.customer.upsert({
    where: { id: "seed-contractor" },
    create: {
      id: "seed-contractor",
      name: "Ahmad Contracting",
      phone: "0500000001",
      isContractor: true,
      creditLimit: 5000,
      balance: 0,
    },
    update: {},
  });

  console.log("Seed complete.");
  console.log("Admin:   admin@electric.shop / admin123");
  console.log("Cashier: cashier@electric.shop / cashier123");
  console.log(`Admin id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
