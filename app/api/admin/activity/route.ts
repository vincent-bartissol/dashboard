import { NextResponse } from "next/server";
import { isAdminUser, isBannedUser } from "@/lib/admin";
import { listRecentActivity } from "@/lib/db/queries";
import { adminActivityLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || isBannedUser(session.user) || !isAdminUser(session.user)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const limited = adminActivityLimit.check(session.user.id);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
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
