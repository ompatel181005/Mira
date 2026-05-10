import { NextResponse } from "next/server";
import { claude, languageInstruction, POWERFUL_MODEL } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

const COMBINE_TOOL = {
  name: "reconcile_health_docs",
  description:
    "Find concrete cross-document inconsistencies, confirmations, and combined next steps across a patient's healthcare documents.",
  input_schema: {
    type: "object" as const,
    properties: {
      headline: {
        type: "string",
        description:
          "ONE sentence, 25 words or less. The single most important thing the patient should know after looking at all docs together. Use **bold** for one key value.",
      },
      findings: {
        type: "array",
        description:
          "0-4 specific cross-document findings. Each is grounded in fields from MULTIPLE documents — do not list per-doc observations. Skip findings that are obvious from a single doc.",
        items: {
          type: "object",
          properties: {
            severity: {
              type: "string",
              enum: ["critical", "warning", "info"],
              description:
                "critical = patient may overpay, miss care, or face urgent risk; warning = inconsistency worth checking; info = useful confirmation.",
            },
            title: {
              type: "string",
              description: "Short headline, 8 words or less.",
            },
            detail: {
              type: "string",
              description:
                "1-2 short sentences. Cite specific values and which document each came from. Plain language.",
            },
            docs_referenced: {
              type: "array",
              items: { type: "string" },
              description: "Filenames of the documents this finding draws from.",
            },
          },
          required: ["severity", "title", "detail", "docs_referenced"],
        },
      },
      combined_next_steps: {
        type: "array",
        items: { type: "string" },
        description:
          "0-3 concrete actions that only make sense when looking at all docs together. One imperative sentence each. Skip if per-doc next steps already cover it.",
      },
    },
    required: ["headline", "findings", "combined_next_steps"],
  },
};

export async function POST(req: Request) {
  try {
    const { docs, language } = (await req.json()) as {
      docs: { filename: string; extracted: any }[];
      language: string;
    };

    if (!docs || docs.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 documents to reconcile." },
        { status: 400 }
      );
    }

    const sysPrompt =
      languageInstruction(language || "en") +
      " You are reconciling a patient's healthcare documents to surface what only becomes visible when looking at them together. Be SHORT. Cite specific values from named documents. Never output JSON, code blocks, or raw field names like 'patient_responsibility' — translate them. Every finding must reference at least 2 documents. Skip per-doc observations.";

    const userPrompt = `Below are ${docs.length} parsed healthcare documents from the same patient. Call reconcile_health_docs.

Look specifically for:
- Bill total vs. EOB allowed/insurance_paid mismatches
- Patient responsibility on the bill not matching what the EOB says is owed
- Medications on a prescription not matching the visit summary
- Lab values flagged abnormal but no follow-up referenced in the visit summary
- Same provider/date appearing across docs (confirmation)
- Charity-care eligibility hint when a bill is large and there's an uninsured/low-income signal elsewhere

Documents:
${docs
  .map(
    (d, i) =>
      `[Doc ${i + 1}: ${d.filename}]\n${JSON.stringify(d.extracted, null, 2)}`
  )
  .join("\n\n")}`;

    const res = await claude().messages.create({
      model: POWERFUL_MODEL,
      max_tokens: 1500,
      system: sysPrompt,
      tools: [COMBINE_TOOL as any],
      tool_choice: { type: "tool", name: "reconcile_health_docs" } as any,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = res.content.find((c: any) => c.type === "tool_use") as any;
    const parsed = (block?.input || {}) as {
      headline?: string;
      findings?: { severity: string; title: string; detail: string; docs_referenced: string[] }[];
      combined_next_steps?: string[];
    };

    return NextResponse.json({
      headline: parsed.headline || "",
      findings: parsed.findings || [],
      combined_next_steps: parsed.combined_next_steps || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
