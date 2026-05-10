import keywords from "@/data/emergency-keywords.json";

export type EmergencyCategory =
  | "cardiac"
  | "stroke"
  | "respiratory"
  | "psychiatric"
  | "obstetric"
  | "anaphylactic";

export type EmergencyMatch = {
  category: EmergencyCategory;
  severity: "critical";
  keyword_matched: string;
};

type KeywordsShape = Record<string, Record<EmergencyCategory, string[]>>;

export function detectEmergency(text: string, language: string): EmergencyMatch | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const langKeys = (keywords as KeywordsShape)[language] || (keywords as KeywordsShape).en;
  // Always also scan English just in case
  const sources = [langKeys, (keywords as KeywordsShape).en];
  for (const src of sources) {
    if (!src) continue;
    for (const cat of Object.keys(src) as EmergencyCategory[]) {
      for (const kw of src[cat]) {
        if (lower.includes(kw.toLowerCase())) {
          return { category: cat, severity: "critical", keyword_matched: kw };
        }
      }
    }
  }
  return null;
}

export function scanDocument(extracted: any): EmergencyMatch | null {
  const labs: any[] = extracted?.lab_values || [];
  for (const lab of labs) {
    const flag = (lab?.flag || "").toString().toLowerCase();
    if (flag.includes("critical") || flag.includes("panic")) {
      return { category: "cardiac", severity: "critical", keyword_matched: lab.name || "lab" };
    }
  }
  const urgent = [
    "acute mi",
    "myocardial infarction",
    "stroke",
    "sepsis",
    "dka",
    "diabetic ketoacidosis",
    "suicidal ideation",
    "st elevation",
    "stemi",
  ];
  const dx: string[] = (extracted?.diagnoses || []).map((d: string) => (d || "").toLowerCase());
  for (const d of dx) {
    for (const u of urgent) {
      if (d.includes(u)) {
        const cat: EmergencyCategory = u.includes("suicid") ? "psychiatric" : "cardiac";
        return { category: cat, severity: "critical", keyword_matched: u };
      }
    }
  }
  const flags: string[] = extracted?.red_flags || [];
  for (const f of flags) {
    if ((f || "").toLowerCase().includes("er") || (f || "").toLowerCase().includes("911")) {
      return { category: "cardiac", severity: "critical", keyword_matched: f };
    }
  }
  return null;
}
