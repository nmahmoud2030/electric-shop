"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError(t("invalidLogin"));
      return;
    }

    const callback = params.get("callbackUrl");
    if (callback) {
      router.push(callback);
      return;
    }

    const me = await fetch("/api/auth/session").then((r) => r.json());
    if (me?.user?.role === "ADMIN") router.push("/admin");
    else if (me?.user?.role === "CASHIER") router.push("/pos");
    else router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)]/90 p-8 shadow-sm backdrop-blur">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--brand)]">{t("shopName")}</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
              {t("login")}
            </h1>
          </div>
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">{t("email")}</span>
            <Input name="email" type="email" required defaultValue="admin@electric.shop" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">{t("password")}</span>
            <Input name="password" type="password" required defaultValue="admin123" />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" size="xl" className="w-full" disabled={loading}>
            {loading ? "..." : t("login")}
          </Button>
        </form>

        <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">{t("demoAccounts")}</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
