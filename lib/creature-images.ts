import type { Creature } from "./types";

/** Unsplash placeholders keyed by creature id (schema has no image column). */
const IMAGES: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&q=80",
  2: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
  3: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80",
  4: "https://images.unsplash.com/photo-1502134249126-9d375944d655?w=800&q=80",
  5: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80",
  6: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0cc5?w=800&q=80",
  7: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&q=80",
  8: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
  9: "https://images.unsplash.com/photo-1534796636912-3b95b0ab5986?w=800&q=80",
};

export function getCreatureImage(creature: Creature): string {
  return (
    IMAGES[creature.id] ??
    "https://images.unsplash.com/photo-1502134249126-9d375944d655?w=800&q=80"
  );
}
