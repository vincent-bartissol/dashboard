import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { listRecentActivity } from "@/lib/db/queries";
import { adminActivityLimit } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireApiSession(adminActivityLimit, { admin: true });
  if (!auth.ok) return auth.response;
  const rows = await listRecentActivity(40);
  return NextResponse.json({
    ok: true,
    activity: rows.map((row) => ({
      id: row.id,
      action: row.action,
      metadata: row.metadata,
      createdAt: row.createdAt,
      userName: row.userName,
      userEmail: row.userEmail,
    })),
  });
}
