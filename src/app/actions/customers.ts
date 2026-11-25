"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money-server";
import { assertCan } from "@/lib/permissions";

export async function createCustomer(formData: FormData) {
  const session = await requireRole("ADMIN");
  assertCan(session.user.role, "customer:credit");

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name required");

  await prisma.customer.create({
    data: {
      name,
      phone: String(formData.get("phone") || "") || null,
      creditLimit: money(Number(formData.get("creditLimit") || 0)),
      isContractor: formData.get("isContractor") === "true",
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath("/pos");
}
