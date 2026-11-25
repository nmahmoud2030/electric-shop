"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || `cat-${Date.now()}`;
}

export async function createCategory(formData: FormData) {
  const session = await requireRole("ADMIN");
  assertCan(session.user.role, "product:create");

  const nameEn = String(formData.get("nameEn") || "").trim();
  const nameAr = String(formData.get("nameAr") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!nameEn || !nameAr) {
    throw new Error("English and Arabic names are required.");
  }

  let slug = slugify(nameEn);
  const exists = await prisma.category.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now().toString(36)}`;

  await prisma.category.create({
    data: {
      nameEn,
      nameAr,
      slug,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/");
}

export async function toggleCategoryActive(categoryId: string) {
  const session = await requireRole("ADMIN");
  assertCan(session.user.role, "product:edit");

  const category = await prisma.category.findUniqueOrThrow({
    where: { id: categoryId },
  });

  await prisma.category.update({
    where: { id: categoryId },
    data: { active: !category.active },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
}
