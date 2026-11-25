"use client";

import { Moon, Sun } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ size = "sm" }: { size?: "sm" | "md" }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const isDark = theme === "dark";

  return (
    <Button
      variant="secondary"
      size={size}
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      }}
      aria-label={t("theme")}
      title={isDark ? t("themeLight") : t("themeDark")}
      className="gap-1.5"
    >
      {isDark ? <Sun className="size-4 shrink-0" /> : <Moon className="size-4 shrink-0" />}
      <span>{isDark ? t("themeLight") : t("themeDark")}</span>
    </Button>
  );
}
