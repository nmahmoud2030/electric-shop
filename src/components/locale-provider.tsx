"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Locale,
  MessageKey,
  dir,
  localizedName,
  t,
} from "@/lib/i18n";
import { formatMoney as formatMoneyBase } from "@/lib/money";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
  dir: "ltr" | "rtl";
  name: (en: string, ar?: string | null) => string;
  money: (value: number | string | { toString(): string }) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("es-locale") as Locale | null;
    if (saved === "en" || saved === "ar") setLocaleState(saved);
    setReady(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("es-locale", l);
    document.documentElement.lang = l;
    document.documentElement.dir = dir(l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir(locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: MessageKey) => t(locale, key),
      dir: dir(locale),
      name: (en: string, ar?: string | null) => localizedName(locale, en, ar),
      money: (value: number | string | { toString(): string }) =>
        formatMoneyBase(value, "ILS", locale),
    }),
    [locale, setLocale],
  );

  // Avoid flashing wrong language before localStorage loads
  if (!ready) {
    return (
      <LocaleContext.Provider value={value}>
        <div className="min-h-screen opacity-0">{children}</div>
      </LocaleContext.Provider>
    );
  }

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
