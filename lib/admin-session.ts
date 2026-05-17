import type { AdminSession } from "./types";

export const ADMIN_COOKIE = "galactic_admin_session";

export function encodeSession(session: AdminSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeSession(value: string | undefined): AdminSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as AdminSession;
    if (
      typeof parsed.id === "number" &&
      typeof parsed.username === "string" &&
      typeof parsed.clearance_level === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds = 60 * 60 * 8) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
