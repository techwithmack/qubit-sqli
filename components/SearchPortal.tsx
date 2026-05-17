"use client";

import { Radar, Search } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  sqlError: string | null;
};

export function SearchPortal({ value, onChange, onSubmit, sqlError }: Props) {
  return (
    <section className="glass relative overflow-hidden rounded-2xl p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 size-56 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="size-5 text-cyan-400" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-white">Search portal</h2>
              <p className="text-xs text-slate-400">Query the bestiary archive by designation</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-orange-200/90">
            <Radar className="size-3" aria-hidden />
            Live uplink
          </span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="creature-search">
            Creature name
          </label>
          <input
            id="creature-search"
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Enter creature name…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
            className="glow-orange flex-1 rounded-xl border border-cyan-500/25 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:shadow-[0_0_24px_rgba(34,211,238,0.15)]"
          />
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-violet-600/20 px-6 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-300/60 hover:from-cyan-500/30 hover:to-violet-600/30"
          >
            <Search className="size-4" aria-hidden />
            Search
          </button>
        </div>
        {sqlError ? (
          <div className="rounded-xl border border-orange-500/35 bg-orange-950/40 px-4 py-3 font-mono text-xs leading-relaxed text-orange-100/95">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-orange-300/90">
              Archive rejected query — diagnostics:
            </span>
            <pre className="mt-2 whitespace-pre-wrap break-all">{sqlError}</pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}
