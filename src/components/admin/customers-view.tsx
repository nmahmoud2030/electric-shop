"use client";

import { createCustomer } from "@/app/actions/customers";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = {
  id: string;
  name: string;
  phone: string | null;
  isContractor: boolean;
  creditLimit: string;
  balance: string;
};

export function CustomersView({ customers }: { customers: Row[] }) {
  const { t, money } = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{t("customers")}</h1>
        <p className="text-[var(--muted)]">{t("customersHint")}</p>
      </div>

      <form
        action={createCustomer}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:grid-cols-5"
      >
        <Input name="name" placeholder={t("name")} required />
        <Input name="phone" placeholder={t("phone")} />
        <Input
          name="creditLimit"
          type="number"
          step="0.01"
          placeholder={t("creditLimit")}
          defaultValue="0"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isContractor" value="true" className="size-4" />
          {t("contractorWholesale")}
        </label>
        <Button type="submit">{t("addCustomer")}</Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface-2)] text-start text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">{t("name")}</th>
              <th className="px-4 py-3">{t("phone")}</th>
              <th className="px-4 py-3">{t("type")}</th>
              <th className="px-4 py-3">{t("creditLimit")}</th>
              <th className="px-4 py-3">{t("balance")}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.phone || "—"}</td>
                <td className="px-4 py-3">
                  {c.isContractor ? t("contractor") : t("retailCustomer")}
                </td>
                <td className="px-4 py-3">{money(c.creditLimit)}</td>
                <td className="px-4 py-3">{money(c.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
