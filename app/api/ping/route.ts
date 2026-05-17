import { exec } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * INTENTIONALLY VULNERABLE (training lab): shell command built from user input.
 * Do not copy this pattern into production software.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { stdout: "", stderr: "", error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const target =
    typeof body === "object" && body !== null && "target" in body
      ? (body as { target?: unknown }).target
      : undefined;

  if (typeof target !== "string" || target.trim() === "") {
    return NextResponse.json(
      { stdout: "", stderr: "", error: "target must be a non-empty string" },
      { status: 400 }
    );
  }

  // FLAW: unsanitized interpolation into shell — command injection surface.
  const command = `ping -c 4 ${target}`;

  return new Promise<NextResponse>((resolve) => {
    exec(
      command,
      { timeout: 15_000, maxBuffer: 1024 * 1024 },
      (err, stdout, stderr) => {
        resolve(
          NextResponse.json({
            stdout: stdout ?? "",
            stderr: stderr ?? "",
            error: err ? err.message : undefined,
          })
        );
      }
    );
  });
}
