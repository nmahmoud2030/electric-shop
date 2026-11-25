"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", key: "dashboard" as const },
  { href: "/admin/products", key: "products" as const },
  { href: "/admin/categories", key: "categories" as const },
  { href: "/admin/customers", key: "customers" as const },
  { href: "/admin/suppliers", key: "suppliers" as const },
  { href: "/admin/reports", key: "reports" as const },
  { href: "/admin/backups", key: "backups" as const },
  { href: "/pos", key: "pos" as const },
];

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <header className="no-print border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
            {t("admin")}
          </p>
          <p className="font-display text-lg font-semibold">{userName}</p>
        </div>
        <nav className="flex flex-wrap gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-xl px-3 py-2 text-sm transition",
                pathname === l.href ||
                  (l.href !== "/admin" && pathname.startsWith(l.href))
                  ? "bg-[var(--brand-soft)] font-medium text-[var(--brand-dark)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)]",
              )}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="flex gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            {t("logout")}
          </Button>
        </div>
      </div>
    </header>
  );
}
