"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Role } from "@prisma/client";
import { findProductByBarcode } from "@/app/actions/products";
import {
  closeShift,
  completeSale,
  getHeldSales,
  holdSale,
  openShift,
  voidHeldSale,
} from "@/app/actions/sales";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CartLine = {
  productId: string;
  nameEn: string;
  nameAr: string;
  barcode: string;
  uom: string;
  unitPrice: number;
  qty: number;
  trackStock: boolean;
  qtyOnHand: number;
};

type ReceiptData = {
  saleNumber: string;
  total: string;
  items: { name: string; qty: string; unitPrice: string; lineTotal: string; uom: string }[];
  payments: { method: string; amount: string }[];
  cashierName: string;
  shopName: string;
  footer: string;
};

type CustomerOption = { id: string; name: string; isContractor: boolean };

export function PosTerminal({
  cashierName,
  role,
  shopNameEn,
  shopNameAr,
  footerEn,
  footerAr,
  customers,
  initialShiftOpen,
}: {
  cashierName: string;
  role: Role;
  shopNameEn: string;
  shopNameAr: string;
  footerEn: string;
  footerAr: string;
  customers: CustomerOption[];
  initialShiftOpen: boolean;
}) {
  const { t, locale, money } = useLocale();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [scan, setScan] = useState("");
  const [message, setMessage] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [payMethod, setPayMethod] = useState<"CASH" | "CARD" | "CREDIT">("CASH");
  const [tendered, setTendered] = useState("");
  const [shiftOpen, setShiftOpen] = useState(initialShiftOpen);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState<Awaited<ReturnType<typeof getHeldSales>>>([]);
  const scanRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const useWholesale = Boolean(selectedCustomer?.isContractor);

  const total = useMemo(
    () => cart.reduce((s, l) => s + l.unitPrice * l.qty, 0),
    [cart],
  );

  const changeDue = useMemo(() => {
    if (payMethod !== "CASH") return 0;
    const paid = Number(tendered || 0);
    return Math.max(0, paid - total);
  }, [payMethod, tendered, total]);

  const refreshHeld = useCallback(async () => {
    setHeld(await getHeldSales());
  }, []);

  useEffect(() => {
    refreshHeld();
    scanRef.current?.focus();
  }, [refreshHeld]);

  useEffect(() => {
    const focus = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Don't steal clicks from buttons, links, inputs, selects, dialogs
      if (
        target.closest(
          "button, a, input, select, textarea, [role='dialog'], label",
        )
      ) {
        return;
      }
      scanRef.current?.focus();
    };
    window.addEventListener("click", focus);
    return () => window.removeEventListener("click", focus);
  }, []);

  async function addByBarcode(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    setMessage("");
    const res = await findProductByBarcode(trimmed);
    if (!res.ok) {
      setMessage(t("barcodeNotFound"));
      setScan("");
      return;
    }
    const p = res.product;
    const price = Number(useWholesale ? p.wholesalePrice : p.retailPrice);
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing && p.uom !== "METER") {
        return prev.map((l) =>
          l.productId === p.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      const qty = p.uom === "METER" ? 1 : 1;
      return [
        ...prev,
        {
          productId: p.id,
          nameEn: p.nameEn,
          nameAr: p.nameAr,
          barcode: p.barcode,
          uom: p.uom,
          unitPrice: price,
          qty,
          trackStock: p.trackStock,
          qtyOnHand: Number(p.qtyOnHand),
        },
      ];
    });
    setScan("");
    if (p.uom === "METER") {
      setMessage(t("enterMeters"));
    }
  }

  function updateQty(productId: string, qty: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, qty: Math.max(0.01, qty) } : l))
        .filter((l) => l.qty > 0),
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  async function ensureShift() {
    if (shiftOpen) return;
    await openShift(0);
    setShiftOpen(true);
  }

  async function onPay() {
    if (!cart.length) return;
    setBusy(true);
    setMessage("");
    try {
      await ensureShift();
      const amount =
        payMethod === "CASH" ? Number(tendered || total) : total;
      if (payMethod === "CASH" && amount < total) {
        setMessage(t("amountTooLow"));
        setBusy(false);
        return;
      }
      if (payMethod === "CREDIT" && !customerId) {
        setMessage(t("selectCustomerCredit"));
        setBusy(false);
        return;
      }

      const res = await completeSale({
        lines: cart.map((l) => ({
          productId: l.productId,
          qty: l.qty,
        })),
        payments: [{ method: payMethod, amount: payMethod === "CASH" ? amount : total }],
        customerId: customerId || null,
        useWholesale,
      });

      const receiptData: ReceiptData = {
        saleNumber: res.sale.saleNumber,
        total: res.sale.total,
        items: res.sale.items,
        payments: res.sale.payments,
        cashierName,
        shopName: locale === "ar" ? shopNameAr : shopNameEn,
        footer: locale === "ar" ? footerAr : footerEn,
      };
      setReceipt(receiptData);
      setCart([]);
      setTendered("");
      setTimeout(() => window.print(), 200);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sale failed");
    } finally {
      setBusy(false);
      scanRef.current?.focus();
    }
  }

  async function onHold() {
    if (!cart.length) return;
    const name = prompt(t("holdName")) || t("holdSale");
    await holdSale({
      name,
      lines: cart.map((l) => ({ productId: l.productId, qty: l.qty })),
      customerId: customerId || null,
      useWholesale,
    });
    setCart([]);
    await refreshHeld();
  }

  async function resumeHold(id: string) {
    const sale = held.find((h) => h.id === id);
    if (!sale) return;
    setCart(
      sale.items.map((i) => ({
        productId: i.productId || "",
        nameEn: i.name,
        nameAr: i.name,
        barcode: i.barcode || "",
        uom: i.uom,
        unitPrice: Number(i.unitPrice),
        qty: Number(i.qty),
        trackStock: true,
        qtyOnHand: 9999,
      })),
    );
    await voidHeldSale(id);
    await refreshHeld();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.2fr_0.8fr]">
      <section className="no-print flex flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--brand)]">{t("pos")}</p>
            <h1 className="font-display text-2xl font-semibold">{cashierName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/">
              <Button variant="secondary" size="sm">
                {t("goToStore")}
              </Button>
            </Link>
            {role === "ADMIN" ? (
              <Link href="/admin">
                <Button variant="secondary" size="sm">
                  {t("goToAdmin")}
                </Button>
              </Link>
            ) : null}
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              {t("logout")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                await openShift(0);
                setShiftOpen(true);
              }}
              disabled={shiftOpen}
            >
              {t("openShift")}
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const v = Number(prompt(t("closingCashPrompt")) || 0);
                await closeShift(v);
                setShiftOpen(false);
              }}
              disabled={!shiftOpen}
            >
              {t("closeShift")}
            </Button>
            <Button variant="ghost" onClick={() => receipt && window.print()} disabled={!receipt}>
              {t("reprint")}
            </Button>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addByBarcode(scan);
          }}
        >
          <Input
            ref={scanRef}
            value={scan}
            onChange={(e) => setScan(e.target.value)}
            placeholder={t("search")}
            className="h-14 text-lg"
            autoComplete="off"
          />
          <Button type="submit" size="xl">
            {t("sell")}
          </Button>
        </form>

        {message ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-left text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">{t("item")}</th>
                <th className="px-4 py-3">{t("quantity")}</th>
                <th className="px-4 py-3">{t("price")}</th>
                <th className="px-4 py-3">{t("total")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--muted)]">
                    {t("emptyCart")}
                  </td>
                </tr>
              ) : (
                cart.map((line) => (
                  <tr key={line.productId} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {locale === "ar" ? line.nameAr : line.nameEn}
                      </div>
                      <div className="text-xs text-[var(--muted)]">{line.barcode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={0.01}
                        step={line.uom === "METER" ? 0.1 : 1}
                        value={line.qty}
                        className="h-10 w-24"
                        onChange={(e) => updateQty(line.productId, Number(e.target.value))}
                      />
                      <span className="ml-1 text-xs text-[var(--muted)]">{line.uom}</span>
                    </td>
                    <td className="px-4 py-3">{money(line.unitPrice)}</td>
                    <td className="px-4 py-3 font-semibold">
                      {money(line.unitPrice * line.qty)}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => removeLine(line.productId)}>
                        ×
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {held.length > 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="mb-2 text-sm font-medium">{t("resume")}</p>
            <div className="flex flex-wrap gap-2">
              {held.map((h) => (
                <Button key={h.id} variant="secondary" size="sm" onClick={() => resumeHold(h.id)}>
                  {h.heldName} · {money(h.total)}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="no-print border-s border-[var(--line)] bg-[var(--surface)]/90 p-4 md:p-6">
        <div className="sticky top-4 space-y-4">
          <div className="rounded-3xl bg-[var(--brand)] p-6 text-white">
            <p className="text-sm/relaxed opacity-80">{t("total")}</p>
            <p className="font-display mt-1 text-5xl font-semibold tracking-tight">
              {money(total)}
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">{t("customers")}</span>
            <select
              className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">{t("walkIn")}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isContractor ? ` ${t("wholesaleTag")}` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {(["CASH", "CARD", "CREDIT"] as const).map((m) => (
              <Button
                key={m}
                variant={payMethod === m ? "primary" : "secondary"}
                onClick={() => setPayMethod(m)}
              >
                {t(m.toLowerCase() as "cash" | "card" | "credit")}
              </Button>
            ))}
          </div>

          {payMethod === "CASH" ? (
            <label className="block space-y-1.5">
              <span className="text-sm text-[var(--muted)]">{t("amountTendered")}</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                placeholder={String(total.toFixed(2))}
              />
              <p className="text-sm text-[var(--muted)]">
                {t("change")}: {money(changeDue)}
              </p>
            </label>
          ) : null}

          <Button size="xl" className="w-full" disabled={!cart.length || busy} onClick={onPay}>
            {t("completeSale")}
          </Button>
          <Button variant="secondary" className="w-full" disabled={!cart.length} onClick={onHold}>
            {t("holdSale")}
          </Button>
        </div>
      </aside>

      {receipt ? (
        <div className="print-area receipt-paper fixed -left-[9999px] top-0 p-3 print:static print:block">
          <div className="text-center">
            <strong className="text-base">{receipt.shopName}</strong>
            <div>{receipt.saleNumber}</div>
            <div>{new Date().toLocaleString()}</div>
            <div>{receipt.cashierName}</div>
          </div>
          <hr className="my-2 border-dashed border-black" />
          {receipt.items.map((item, idx) => (
            <div key={idx} className="mb-1">
              <div>{item.name}</div>
              <div className="flex justify-between">
                <span>
                  {item.qty} {item.uom} × {item.unitPrice}
                </span>
                <span>{item.lineTotal}</span>
              </div>
            </div>
          ))}
          <hr className="my-2 border-dashed border-black" />
          <div className="flex justify-between text-base font-bold">
            <span>{t("total")}</span>
            <span>{receipt.total}</span>
          </div>
          {receipt.payments.map((p, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{p.method}</span>
              <span>{p.amount}</span>
            </div>
          ))}
          <div className="mt-3 text-center text-[10px]">*{receipt.saleNumber}*</div>
          <div className="mt-2 text-center">{receipt.footer}</div>
        </div>
      ) : null}
    </div>
  );
}
