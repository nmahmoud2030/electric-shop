import { readdir, readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dir = path.join(process.cwd(), "backups", "goods");
  try {
    const files = (await readdir(dir))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    if (!files[0]) {
      return NextResponse.json({ error: "No goods export yet" }, { status: 404 });
    }
    const body = await readFile(path.join(dir, files[0]), "utf8");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${files[0]}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "No goods export yet" }, { status: 404 });
  }
}
