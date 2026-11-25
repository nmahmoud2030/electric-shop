"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function BarcodeLabel({
  name,
  nameAr,
  barcode,
  price,
}: {
  name: string;
  nameAr?: string;
  barcode: string;
  price: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { t, name: locName, money } = useLocale();

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, barcode, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 8,
      });
    }
  }, [barcode]);

  return (
    <div>
      <div className="no-print mb-4 space-y-2">
        <h1 className="font-display text-2xl font-semibold">{t("printBarcodeLabel")}</h1>
        <p className="text-sm text-[var(--muted)]">{t("printBarcodeHint")}</p>
        <Button onClick={() => window.print()}>{t("print")}</Button>
      </div>
      <div className="print-area inline-block rounded-xl border border-black bg-white p-4 text-center text-black">
        <div className="mb-1 text-sm font-semibold">{locName(name, nameAr)}</div>
        <div className="mb-2 text-base font-bold">{money(price)}</div>
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
