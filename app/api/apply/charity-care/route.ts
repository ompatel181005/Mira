import { NextResponse } from "next/server";
import { loadHospitals } from "@/lib/cms-hospitals";
import { pctOfFPL } from "@/lib/fpl";
import { claude, languageInstruction, DEFAULT_MODEL, DISCLAIMER } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    hospitalName,
    householdSize,
    annualIncome,
    name,
    address,
    language,
  } = body as {
    hospitalName: string;
    householdSize: number;
    annualIncome?: number;
    name?: string;
    address?: string;
    language: string;
  };

  const hospitals = loadHospitals();
  const hospital = hospitals.find((h) => h.name === hospitalName) || hospitals[0];
  if (!hospital) return NextResponse.json({ error: "No hospital data" }, { status: 404 });

  const fullThreshold = hospital.income_threshold_full ?? 200;
  const partialThreshold = hospital.income_threshold_partial ?? 400;

  let verdict: "full" | "partial" | "above" | "unknown" = "unknown";
  let pct: number | null = null;
  if (annualIncome != null && householdSize > 0) {
    pct = pctOfFPL(annualIncome, householdSize);
    if (pct <= fullThreshold) verdict = "full";
    else if (pct <= partialThreshold) verdict = "partial";
    else verdict = "above";
  }

  // Generate cover letter + phone script via Claude
  const sys =
    languageInstruction(language || "en") +
    ` You write polite, professional, assertive financial-assistance correspondence in the user's language. Always include the disclaimer: "${DISCLAIMER}"`;

  const prompt = `Generate two short pieces of text for a patient applying to ${hospital.name} for charity care:

1) A pre-filled cover letter addressed to the Financial Assistance Department. Mention:
   - The patient's name (${name || "[NAME]"}) and address (${address || "[ADDRESS]"})
   - Household size of ${householdSize}
   - Request for financial assistance under the hospital's 501(r) Financial Assistance Policy
   - Reference the policy URL: ${hospital.charity_care_policy_url}
   - Polite, professional tone
2) A short phone script (≤120 words) to read to the billing department asking about the financial assistance application, sliding scale, and what documents to bring.

Return JSON: {"cover_letter": "...", "phone_script": "..."}`;

  let cover = "";
  let script = "";
  try {
    const res = await claude().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1500,
      system: sys,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text : "";
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]);
      cover = parsed.cover_letter || "";
      script = parsed.phone_script || "";
    } else {
      cover = text;
    }
  } catch (e: any) {
    cover = `Dear Financial Assistance Department,\n\nMy name is ${name || "[Your name]"} and I live at ${address || "[Your address]"}. My household includes ${householdSize} people. I am writing to request financial assistance under your 501(r) Financial Assistance Policy (${hospital.charity_care_policy_url}). Please send me the application and let me know which documents I should provide.\n\nThank you,\n${name || "[Your name]"}`;
    script = `Hello, I'm a patient and I'd like to apply for financial assistance. Could you please tell me how to start the application, what documents you need, and whether you offer a sliding scale based on income? I want to make sure I qualify for any charity care available before paying my bill. Thank you.`;
  }

  return NextResponse.json({
    hospital: {
      name: hospital.name,
      phone: hospital.phone,
      policy_url: hospital.charity_care_policy_url,
      application_url: hospital.charity_care_application_url || null,
      required_documents: hospital.required_documents || [],
      thresholds: { full: fullThreshold, partial: partialThreshold },
    },
    verdict,
    fpl_percent: pct,
    cover_letter: cover,
    phone_script: script,
  });
}
