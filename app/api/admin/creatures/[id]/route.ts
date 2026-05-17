import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import type { Creature } from "@/lib/types";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Admin session required" }, { status: 401 });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id: idRaw } = await context.params;
  const id = parseInt(idRaw, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

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
      `UPDATE creatures SET name = @name, species = @species, danger_level = @danger_level,
       home_planet = @home_planet, description = @description WHERE id = @id`
    )
    .run({ id, name, species, danger_level, home_planet, description });

  if (result.changes === 0) {
    return NextResponse.json({ error: "Creature not found" }, { status: 404 });
  }

  const creature = db.prepare("SELECT * FROM creatures WHERE id = ?").get(id) as Creature;
  return NextResponse.json({ creature });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id: idRaw } = await context.params;
  const id = parseInt(idRaw, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM creatures WHERE id = ?").run(id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Creature not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
