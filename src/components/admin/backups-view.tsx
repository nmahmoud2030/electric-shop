"use client";

import { runBackupExports } from "@/app/actions/backups";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function BackupsView({
  logs,
}: {
  logs: { id: string; type: string; status: string; createdAt: string }[];
}) {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{t("backups")}</h1>
        <p className="text-[var(--muted)]">{t("backupsHint")}</p>
      </div>

      <form action={runBackupExports}>
        <Button type="submit" size="lg">
          {t("runBackup")}
        </Button>
      </form>

      <div className="flex flex-wrap gap-3">
        <a
          className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm"
          href="/api/backups/finance"
        >
          {t("downloadFinance")}
        </a>
        <a
          className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm"
          href="/api/backups/goods"
        >
          {t("downloadGoods")}
        </a>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="font-display text-xl font-semibold">{t("recentRuns")}</h2>
        <ul className="mt-4 divide-y divide-[var(--line)] text-sm">
          {logs.length === 0 ? (
            <li className="py-6 text-center text-[var(--muted)]">{t("noBackups")}</li>
          ) : (
            logs.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-2 py-3">
                <span>
                  {l.type} · {l.status}
                </span>
                <span className="text-[var(--muted)]">{l.createdAt}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-5 text-sm leading-relaxed text-[var(--muted)]">
        <p className="font-medium text-[var(--ink)]">{t("restoreOps")}</p>
        <ol className="mt-2 list-decimal space-y-1 ps-5">
          <li>{t("restoreStep1")}</li>
          <li>{t("restoreStep2")}</li>
          <li>{t("restoreStep3")}</li>
          <li>{t("restoreStep4")}</li>
        </ol>
      </section>
    </div>
  );
}
