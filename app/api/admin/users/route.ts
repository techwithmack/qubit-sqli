import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Admin session required" }, { status: 401 });
  }

  const db = getDb();
  const users = db
    .prepare(
      "SELECT id, username, password, clearance_level FROM users ORDER BY id"
    )
    .all() as User[];

  return NextResponse.json({ users });
}
