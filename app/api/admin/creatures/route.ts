import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import type { Creature } from "@/lib/types";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Admin session required" }, { status: 401 });
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const db = getDb();
  const creatures = db
    .prepare("SELECT * FROM creatures ORDER BY id")
    .all() as Creature[];
  return NextResponse.json({ creatures });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const species = typeof b.species === "string" ? b.species.trim() : "";
  const home_planet = typeof b.home_planet === "string" ? b.home_planet.trim() : "";
  const description = typeof b.description === "string" ? b.description.trim() : "";
  const danger_level =
    typeof b.danger_level === "number"
      ? b.danger_level
      : parseInt(String(b.danger_level ?? ""), 10);

  if (!name || !species || !home_planet || !description || Number.isNaN(danger_level)) {
    return NextResponse.json({ error: "All creature fields are required" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO creatures (name, species, danger_level, home_planet, description)
       VALUES (@name, @species, @danger_level, @home_planet, @description)`
    )
    .run({ name, species, danger_level, home_planet, description });

  const creature = db
    .prepare("SELECT * FROM creatures WHERE id = ?")
    .get(result.lastInsertRowid) as Creature;

  return NextResponse.json({ creature }, { status: 201 });
}
