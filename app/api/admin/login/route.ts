import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { User } from "@/lib/types";
import {
  ADMIN_COOKIE,
  encodeSession,
  sessionCookieOptions,
} from "@/lib/admin-session";

export const runtime = "nodejs";

/**
 * INTENTIONALLY VULNERABLE (training lab): credentials interpolated into SQL.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username =
    typeof body === "object" && body !== null && "username" in body
      ? (body as { username?: unknown }).username
      : undefined;
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? (body as { password?: unknown }).password
      : undefined;

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "username and password are required" },
      { status: 400 }
    );
  }

  const db = getDb();

  // FLAW: authentication query built via string interpolation — login bypass / SQLi.
  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  try {
    const user = db.prepare(sql).get() as User | undefined;
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        clearance_level: user.clearance_level,
      },
    });
    response.cookies.set(
      ADMIN_COOKIE,
      encodeSession({
        id: user.id,
        username: user.username,
        clearance_level: user.clearance_level,
      }),
      sessionCookieOptions()
    );
    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Login failed", sqlError: message },
      { status: 400 }
    );
  }
}
