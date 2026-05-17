import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Creature } from "@/lib/types";

export const runtime = "nodejs";

export function GET() {
  try {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM creatures ORDER BY id");
    const creatures = stmt.all() as Creature[];
    return NextResponse.json({ creatures });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
