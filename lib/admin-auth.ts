import { cookies } from "next/headers";
import { ADMIN_COOKIE, decodeSession } from "./admin-session";
import type { AdminSession } from "./types";

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return decodeSession(jar.get(ADMIN_COOKIE)?.value);
}

export function getAdminSessionFromRequest(request: Request): AdminSession | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  return decodeSession(match?.[1]);
}
