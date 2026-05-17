import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Creature } from "@/lib/types";

export const runtime = "nodejs";

/**
 * INTENTIONALLY VULNERABLE (training lab): user input interpolated directly into SQL.
 * Do not copy this pattern into production software.
 */
export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const db = getDb();

  try {
    // FLAW: textbook SQLi — template literal passed straight to prepare().
    const rows = db
      .prepare(`SELECT * FROM creatures WHERE name LIKE '%${q}%'`)
      .all() as Creature[];
    return NextResponse.json({ rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ rows: [] as Creature[], sqlError: message });
  }
}
