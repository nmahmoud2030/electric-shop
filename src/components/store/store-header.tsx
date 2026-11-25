"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function StoreHeader({ shopName }: { shopName: string }) {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-display text-lg font-semibold text-[var(--brand-dark)]">
          {shopName}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Link href="/login">
            <Button size="sm">{t("login")}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
