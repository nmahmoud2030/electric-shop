"use client";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function LanguageToggle({ size = "sm" }: { size?: "sm" | "md" }) {
  const { locale, setLocale } = useLocale();
  return (
    <Button
      variant="secondary"
      size={size}
      type="button"
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      aria-label="Language"
    >
      {locale === "en" ? "عربي" : "EN"}
    </Button>
  );
}
