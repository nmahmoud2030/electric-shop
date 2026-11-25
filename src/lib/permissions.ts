import type { Role } from "@prisma/client";

export type Action =
  | "product:create"
  | "product:edit"
  | "product:price"
  | "stock:adjust"
  | "supplier:manage"
  | "purchase:manage"
  | "customer:credit"
  | "report:view"
  | "backup:manage"
  | "user:manage"
  | "pos:sell"
  | "pos:price_override"
  | "pos:return"
  | "order:manage";

const permissions: Record<Role, Action[]> = {
  ADMIN: [
    "product:create",
    "product:edit",
    "product:price",
    "stock:adjust",
    "supplier:manage",
    "purchase:manage",
    "customer:credit",
    "report:view",
    "backup:manage",
    "user:manage",
    "pos:sell",
    "pos:price_override",
    "pos:return",
    "order:manage",
  ],
  CASHIER: ["pos:sell", "pos:return"],
  CUSTOMER: [],
};

export function can(role: Role | undefined | null, action: Action): boolean {
  if (!role) return false;
  return permissions[role]?.includes(action) ?? false;
}

export function assertCan(role: Role | undefined | null, action: Action): void {
  if (!can(role, action)) {
    throw new Error("You do not have permission for this action.");
  }
}
