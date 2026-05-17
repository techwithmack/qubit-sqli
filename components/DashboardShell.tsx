"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, startTransition, useState } from "react";
import type { Creature } from "@/lib/types";
import { CreatureGrid } from "./CreatureGrid";
import { PlanetPingTool } from "./PlanetPingTool";
import { SearchPortal } from "./SearchPortal";
import { Orbit, ShieldAlert } from "lucide-react";

const QuadrantChart = dynamic(
  () => import("./QuadrantChart").then((mod) => mod.QuadrantChart),
  {
    ssr: false,
    loading: () => (
      <section className="glass rounded-2xl p-6">
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-cyan-500/20 bg-slate-950/40 text-sm text-slate-500">
          Calibrating chart…
        </div>
      </section>
    ),
  }
);

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export default function DashboardShell() {
  const [baseline, setBaseline] = useState<Creature[]>([]);
  const [displayed, setDisplayed] = useState<Creature[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const data = await fetchJson<{ creatures?: Creature[] }>("/api/creatures", {
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        const list = data.creatures ?? [];
        startTransition(() => {
          setBaseline(list);
          setDisplayed(list);
          setLoadError(null);
        });
      } catch (e) {
        if (ac.signal.aborted) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        startTransition(() => {
          setLoadError(e instanceof Error ? e.message : "Failed to load catalog");
        });
      }
    })();
    return () => ac.abort();
  }, []);

  const applySearch = useCallback(
    async (qRaw: string, opts?: { signal?: AbortSignal }) => {
      const signal = opts?.signal;
      const q = qRaw.trim();
      if (q === "") {
        startTransition(() => {
          setDisplayed(baseline);
          setSqlError(null);
        });
        return;
      }
      try {
        const res = await fetch("/api/search?q=" + encodeURIComponent(qRaw), { signal });
        const data = (await res.json()) as {
          rows?: Creature[];
          sqlError?: string;
        };
        if (signal?.aborted) return;
        startTransition(() => {
          setDisplayed(data.rows ?? []);
          setSqlError(typeof data.sqlError === "string" ? data.sqlError : null);
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (signal?.aborted) return;
        startTransition(() => {
          setSqlError("Search request failed.");
          setDisplayed([]);
        });
      }
    },
    [baseline]
  );

  useEffect(() => {
    if (!baseline.length) return;
    const ac = new AbortController();
    void applySearch(debouncedSearch, { signal: ac.signal });
    return () => ac.abort();
  }, [debouncedSearch, baseline, applySearch]);

  const searchNow = useCallback(() => {
    void applySearch(searchInput);
  }, [applySearch, searchInput]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-cyan-300/80">
              Xenobiology // Restricted
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl glow-cyan">
              The Galactic Bestiary
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Consolidated threat profiles from deep-recon units. Handle archive queries with
              operational discretion.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-xs text-orange-100/90">
            <ShieldAlert className="size-4 shrink-0 text-orange-400" aria-hidden />
            <span>Training lattice — synthetic telemetry only.</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8">
        <main className="flex min-w-0 flex-1 flex-col gap-10">
          {loadError ? (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {loadError}
            </div>
          ) : null}
          <SearchPortal
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={searchNow}
            sqlError={sqlError}
          />
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Orbit className="size-5 text-violet-400" aria-hidden />
              <h2 className="text-lg font-semibold text-white">Creature grid</h2>
              <span className="ml-auto text-xs text-slate-500">
                {displayed.length} record{displayed.length === 1 ? "" : "s"}
              </span>
            </div>
            <CreatureGrid
              creatures={displayed}
              emptyMessage="No matching entries — widen your scan parameters or clear the filter."
            />
          </section>
          <QuadrantChart creatures={baseline} />
        </main>
        <div className="shrink-0 lg:w-80">
          <PlanetPingTool />
        </div>
      </div>
    </div>
  );
}
