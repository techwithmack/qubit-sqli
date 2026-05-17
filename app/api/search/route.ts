import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Creature } from "@/lib/types";

export const runtime = "nodejs";

/**
 * INTENTIONALLY VULNERABLE (training lab): query built via string interpolation.
 * Do not copy this pattern into production software.
 */
export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const db = getDb();

  // FLAW: user input concatenated into SQL — classic SQLi surface.
  const sql = `SELECT * FROM creatures WHERE name LIKE '%${q}%'`;

  try {
    const rows = db.prepare(sql).all() as Creature[];
    return NextResponse.json({ rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ rows: [] as Creature[], sqlError: message });
  }
}
