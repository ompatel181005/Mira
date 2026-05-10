import data from "@/data/nadac-prices.json";

export type NadacRow = { generic: string; price_per_unit: number; unit: string };

export function nadacLookup(generic: string): NadacRow | null {
  if (!generic) return null;
  const lower = generic.toLowerCase();
  const rows = data as NadacRow[];
  return rows.find((r) => r.generic.toLowerCase() === lower) || null;
}
