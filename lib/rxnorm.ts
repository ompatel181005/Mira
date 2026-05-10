// RxNorm: brand -> generic. Best-effort with timeout, returns null on failure.

export type RxNormResult = { rxcui: string | null; generic: string | null };

export async function brandToGeneric(name: string): Promise<RxNormResult> {
  try {
    const r = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!r.ok) return { rxcui: null, generic: null };
    const j: any = await r.json();
    const rxcui: string | null = j?.idGroup?.rxnormId?.[0] || null;
    if (!rxcui) return { rxcui: null, generic: null };
    const r2 = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?tty=IN+SBD+SCD`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!r2.ok) return { rxcui, generic: null };
    const j2: any = await r2.json();
    const groups: any[] = j2?.relatedGroup?.conceptGroup || [];
    const ing = groups.find((g) => g.tty === "IN");
    const generic = ing?.conceptProperties?.[0]?.name || null;
    return { rxcui, generic };
  } catch {
    return { rxcui: null, generic: null };
  }
}
