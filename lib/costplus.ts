export type CostPlusResult = {
  medication_name: string;
  strength: string;
  form: string;
  unit_price: string;
  url: string;
};

function parsePrice(value: string | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export async function costPlusLookup(name: string): Promise<CostPlusResult | null> {
  if (!name.trim()) return null;

  try {
    const url = new URL("https://us-central1-costplusdrugs-publicapi.cloudfunctions.net/main");
    url.searchParams.set("medication_name", name);

    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;

    const json = (await response.json()) as { results?: CostPlusResult[] };
    const results = (json.results || []).filter((result) => result.unit_price && result.url);
    if (results.length === 0) return null;

    return results.sort((a, b) => parsePrice(a.unit_price) - parsePrice(b.unit_price))[0];
  } catch {
    return null;
  }
}
