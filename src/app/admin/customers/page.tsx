import { prisma } from "@/lib/db";
import { CustomersView } from "@/components/admin/customers-view";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <CustomersView
      customers={customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        isContractor: c.isContractor,
        creditLimit: c.creditLimit.toString(),
        balance: c.balance.toString(),
      }))}
    />
  );
}
