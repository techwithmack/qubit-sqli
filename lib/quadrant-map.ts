/** Maps seeded home_planet values to chart quadrants (no DB column). */
const PLANET_TO_QUADRANT: Record<string, "Alpha" | "Beta" | "Gamma" | "Delta"> = {
  "Xylos Prime": "Alpha",
  "Kethara Rift": "Alpha",
  "Orion Drift Station": "Beta",
  "Vantara IX": "Beta",
  "Nebula-7 Outpost": "Gamma",
  "Sol-Proxima Gate": "Gamma",
  "Erebus Depths": "Delta",
  "Lunara Expanse": "Delta",
  "Helios Trench": "Alpha",
};

export function planetToQuadrant(planet: string): "Alpha" | "Beta" | "Gamma" | "Delta" {
  return PLANET_TO_QUADRANT[planet] ?? "Delta";
}
