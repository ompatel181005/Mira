import data from "@/data/nadac-prices.json";

export type NadacRow = { generic: string; price_per_unit: number; unit: string };

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function nadacLookup(generic: string): NadacRow | null {
  if (!generic) return null;
  const lower = normalize(generic);
  const rows = data as NadacRow[];
  return rows.find((r) => normalize(r.generic) === lower) || null;
}

export function nadacAlternatives(generic: string, limit = 5): NadacRow[] {
  if (!generic) return [];
  const queryTokens = normalize(generic)
    .split(" ")
    .filter((token) => token.length > 3);
  if (queryTokens.length === 0) return [];

  const rows = data as NadacRow[];
  return rows
    .map((row) => {
      const rowText = normalize(row.generic);
      const score = queryTokens.reduce((sum, token) => sum + (rowText.includes(token) ? 1 : 0), 0);
      return { row, score };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.row.price_per_unit - b.row.price_per_unit)
    .slice(0, limit)
    .map((match) => match.row);
}
