import type { Creature } from "@/lib/types";
import { CreatureCard } from "./CreatureCard";

export function CreatureGrid({
  creatures,
  emptyMessage,
}: {
  creatures: Creature[];
  emptyMessage?: string;
}) {
  if (creatures.length === 0) {
    return (
      <div className="glass rounded-2xl border border-dashed border-cyan-500/30 p-12 text-center text-slate-400">
        <p className="text-sm">{emptyMessage ?? "No creatures in this sector."}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {creatures.map((c) => (
        <CreatureCard key={c.id} creature={c} />
      ))}
    </div>
  );
}
