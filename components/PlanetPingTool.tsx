"use client";

import { Loader2, Satellite, Terminal } from "lucide-react";
import { useState } from "react";

type PingResponse = {
  stdout: string;
  stderr: string;
  error?: string;
};

export function PlanetPingTool() {
  const [target, setTarget] = useState("");
  const [result, setResult] = useState<PingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function runPing() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = (await res.json()) as PingResponse;
      setResult(data);
    } catch (e) {
      setResult({
        stdout: "",
        stderr: "",
        error: e instanceof Error ? e.message : "Request failed",
      });
    } finally {
      setLoading(false);
    }
  }

  const rawBlock = result
    ? [result.stdout, result.stderr, result.error ? `process: ${result.error}` : ""]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <aside className="glass sticky top-6 flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start gap-2">
        <Satellite className="mt-0.5 size-5 shrink-0 text-orange-400" aria-hidden />
        <div>
          <h2 className="text-base font-semibold text-white">Check planet connectivity</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Relay diagnostic: sends a short ping burst to the supplied host or relay address.
          </p>
        </div>
      </div>
      <label className="sr-only" htmlFor="ping-target">
        IP or hostname
      </label>
      <input
        id="ping-target"
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="e.g. 127.0.0.1"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void runPing();
        }}
        className="rounded-xl border border-orange-500/25 bg-slate-950/60 px-3 py-2.5 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-orange-400/50"
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => void runPing()}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-400/40 bg-orange-500/15 py-2.5 text-sm font-semibold text-orange-50 transition hover:bg-orange-500/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Run relay ping
      </button>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <Terminal className="size-3.5" aria-hidden />
          Raw terminal stream
        </div>
        <pre className="max-h-80 min-h-[8rem] overflow-auto rounded-xl border border-slate-700/60 bg-slate-950/80 p-3 font-mono text-[11px] leading-relaxed text-emerald-200/90">
          {rawBlock || (loading ? "Awaiting uplink…" : "No transmission yet.")}
        </pre>
      </div>
    </aside>
  );
}
