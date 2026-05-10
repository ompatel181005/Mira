export type OpenFDAInfo = {
  purpose: string | null;
  manufacturer: string | null;
};

export async function drugInfo(generic: string): Promise<OpenFDAInfo> {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22${encodeURIComponent(
      generic
    )}%22&limit=1`;
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return { purpose: null, manufacturer: null };
    const j: any = await r.json();
    const result = j?.results?.[0];
    return {
      purpose: result?.purpose?.[0] || result?.indications_and_usage?.[0] || null,
      manufacturer: result?.openfda?.manufacturer_name?.[0] || null,
    };
  } catch {
    return { purpose: null, manufacturer: null };
  }
}
