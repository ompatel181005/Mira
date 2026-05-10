import { NextResponse } from "next/server";
import { claude, languageInstruction, POWERFUL_MODEL } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUMMARIZE_TOOL = {
  name: "summarize_health_doc",
  description:
    "Produce a plain-language summary, explanation, and next steps for a healthcare document.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description:
          "ONE sentence, 25 words or less. State the single most important fact in this document — what it is and the headline number/result/diagnosis. Use **bold** for one key value. No preamble like 'This document is...'.",
      },
      what_this_means: {
        type: "string",
        description:
          "ONE short paragraph, 60 words or less. Explain ONLY what is not already obvious from the summary — implications, urgency, or context. Do not restate the summary. Plain prose, 6th-grade reading level.",
      },
      next_steps: {
        type: "array",
        items: { type: "string" },
        description:
          "Exactly 3 items. Each item is ONE short imperative sentence (under 15 words). Most important first. No filler like 'consider' or 'you might want to' — be direct.",
      },
      key_terms: {
        type: "array",
        items: {
          type: "object",
          properties: {
            term: { type: "string" },
            plain_meaning: { type: "string" },
          },
          required: ["term", "plain_meaning"],
        },
        description:
          "0-3 jargon terms ONLY if they appear in the document and a typical patient would not understand them. plain_meaning is one short sentence. Empty array if everything is plain.",
      },
    },
    required: ["summary", "what_this_means", "next_steps"],
  },
};

export async function POST(req: Request) {
  try {
    const { extracted, language } = (await req.json()) as {
      extracted: any;
      language: string;
    };

    if (!extracted) {
      return NextResponse.json({ error: "No extracted document" }, { status: 400 });
    }

    const sysPrompt =
      languageInstruction(language || "en") +
      " You write for an anxious, busy patient with no medical background. Be SHORT. Each field has a strict word cap — respect it. No preamble, no restating, no hedging, no disclaimer (the UI shows one). Never output JSON, code blocks, markdown headings, or raw field names. Use **bold** at most twice across all fields, only on the single most critical number/date/name.";

    const userPrompt = `A healthcare document was parsed into the structured fields below. Call summarize_health_doc with concise output that respects every word cap.

The three fields must NOT overlap:
- summary = the single headline fact (one sentence).
- what_this_means = the implication or urgency the patient might miss (one short paragraph, NEW info only).
- next_steps = exactly 3 imperative actions, ranked by priority.

Tailor next_steps to doc_type:
- "bill": one step about charity-care eligibility (link to "Get Help Applying" page); one about negotiating or asking for an itemized bill.
- "lab_report": if any value is critical or flagged, the FIRST step is contacting the provider with a timeframe.
- "prescription": one step about asking for the generic and one about checking "Lower Costs".
- "visit_summary": one step is a specific question to ask the doctor next time.
- "insurance_eob": one step is verifying the patient_responsibility against the bill.

Document fields:
${JSON.stringify(extracted, null, 2)}`;

    const res = await claude().messages.create({
      model: POWERFUL_MODEL,
      max_tokens: 1500,
      system: sysPrompt,
      tools: [SUMMARIZE_TOOL as any],
      tool_choice: { type: "tool", name: "summarize_health_doc" } as any,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = res.content.find((c: any) => c.type === "tool_use") as any;
    const parsed = (block?.input || {}) as {
      summary?: string;
      what_this_means?: string;
      next_steps?: string[];
      key_terms?: { term: string; plain_meaning: string }[];
    };

    return NextResponse.json({
      summary: parsed.summary || "",
      what_this_means: parsed.what_this_means || "",
      next_steps: parsed.next_steps || [],
      key_terms: parsed.key_terms || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
