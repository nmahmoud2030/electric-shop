import { prisma } from "@/lib/db";
import { BackupsView } from "@/components/admin/backups-view";

export default async function BackupsPage() {
  const logs = await prisma.backupLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <BackupsView
      logs={logs.map((l) => ({
        id: l.id,
        type: l.type,
        status: l.status,
        createdAt: new Date(l.createdAt).toLocaleString(),
      }))}
    />
  );
}
