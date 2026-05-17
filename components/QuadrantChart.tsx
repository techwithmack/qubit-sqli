"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Creature } from "@/lib/types";
import { planetToQuadrant } from "@/lib/quadrant-map";
import { Orbit } from "lucide-react";

const ORDER = ["Alpha", "Beta", "Gamma", "Delta"] as const;

const BAR_COLORS = [
  "rgb(34, 211, 238)",
  "rgb(167, 139, 250)",
  "rgb(251, 146, 60)",
  "rgb(244, 114, 182)",
];

function buildChartData(creatures: Creature[]) {
  const counts: Record<(typeof ORDER)[number], number> = {
    Alpha: 0,
    Beta: 0,
    Gamma: 0,
    Delta: 0,
  };
  for (const c of creatures) {
    counts[planetToQuadrant(c.home_planet)]++;
  }
  return ORDER.map((name, i) => ({
    quadrant: name,
    population: counts[name],
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));
}

export function QuadrantChart({ creatures }: { creatures: Creature[] }) {
  const data = useMemo(() => buildChartData(creatures), [creatures]);

  return (
    <section className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Orbit className="size-5 text-orange-400" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold text-white">Creature distribution</h2>
          <p className="text-xs text-slate-400">Population by quadrant (catalog baseline)</p>
        </div>
      </div>
      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis
              dataKey="quadrant"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148,163,184,0.3)" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148,163,184,0.3)" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(34,211,238,0.06)" }}
              contentStyle={{
                background: "rgba(15, 23, 42, 0.92)",
                border: "1px solid rgba(34, 211, 238, 0.25)",
                borderRadius: "12px",
                color: "#e2e8f0",
              }}
              formatter={(value) => [`${value ?? 0}`, "Creatures"]}
              labelFormatter={(label) => `Quadrant ${label}`}
            />
            <Bar dataKey="population" radius={[8, 8, 0, 0]} maxBarSize={56}>
              {data.map((entry) => (
                <Cell key={entry.quadrant} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
