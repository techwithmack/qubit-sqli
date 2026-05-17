"use client";

import Image from "next/image";
import { AlertTriangle, MapPin, Sparkles } from "lucide-react";
import type { Creature } from "@/lib/types";
import { getCreatureImage } from "@/lib/creature-images";

function dangerTone(level: number): string {
  if (level >= 9) return "text-orange-300 border-orange-400/50 bg-orange-500/10";
  if (level >= 7) return "text-amber-200 border-amber-400/40 bg-amber-500/10";
  if (level >= 5) return "text-cyan-200 border-cyan-400/40 bg-cyan-500/10";
  return "text-violet-200 border-violet-400/40 bg-violet-500/10";
}

export function CreatureCard({ creature }: { creature: Creature }) {
  const img = getCreatureImage(creature);
  const tone = dangerTone(creature.danger_level);

  return (
    <article className="glass group relative flex flex-col overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(34,211,238,0.25)]">
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={img}
          alt={creature.name}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover transition duration-500 group-hover:scale-105"
          priority={creature.id <= 3}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
        <span
          className={`absolute right-3 top-3 flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}
        >
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          D-{creature.danger_level}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white glow-cyan">
            {creature.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-cyan-200/90">
            <Sparkles className="size-3.5 shrink-0 text-cyan-400" aria-hidden />
            {creature.species}
          </p>
        </div>
        <p className="flex items-start gap-1.5 text-xs text-slate-400">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-orange-300/90" aria-hidden />
          {creature.home_planet}
        </p>
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-300/95">
          {creature.description}
        </p>
      </div>
    </article>
  );
}
