import { NextResponse } from "next/server";
import { claude, languageInstruction, POWERFUL_MODEL } from "@/lib/claude";
import { scanDocument } from "@/lib/emergency";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXTRACT_TOOL = {
  name: "extract_health_doc",
  description: "Extracts structured fields from a healthcare document.",
  input_schema: {
    type: "object" as const,
    properties: {
      doc_type: {
        type: "string",
        enum: ["visit_summary", "bill", "lab_report", "prescription", "insurance_eob", "other"],
      },
      provider_name: { type: ["string", "null"] },
      provider_address: { type: ["string", "null"] },
      date: { type: ["string", "null"] },
      diagnoses: { type: "array", items: { type: "string" } },
      lab_values: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" },
            units: { type: ["string", "null"] },
            normal_range: { type: ["string", "null"] },
            flag: { type: ["string", "null"] },
          },
          required: ["name", "value"],
        },
      },
      medications: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            dose: { type: ["string", "null"] },
            frequency: { type: ["string", "null"] },
            generic_available: { type: ["boolean", "null"] },
          },
          required: ["name"],
        },
      },
      bill_total: { type: ["number", "null"] },
      bill_line_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            cpt_code: { type: ["string", "null"] },
            charge: { type: ["number", "null"] },
          },
          required: ["description"],
        },
      },
      insurance_paid: { type: ["number", "null"] },
      patient_responsibility: { type: ["number", "null"] },
      due_date: { type: ["string", "null"] },
      follow_up_needed: { type: ["string", "null"] },
      red_flags: { type: "array", items: { type: "string" } },
    },
    required: ["doc_type"],
  },
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const language = (formData.get("language") || "en").toString();
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const mediaType = isPdf ? "application/pdf" : (file.type || "image/jpeg");

    const docContent: any = isPdf
      ? { type: "document", source: { type: "base64", media_type: mediaType, data: bytes } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: bytes } };

    // Stage 1: extract structured JSON via tool use
    const extractRes = await claude().messages.create({
      model: POWERFUL_MODEL,
      max_tokens: 2048,
      tools: [EXTRACT_TOOL as any],
      tool_choice: { type: "tool", name: "extract_health_doc" } as any,
      messages: [
        {
          role: "user",
          content: [
            docContent,
            {
              type: "text",
              text: "Extract all available structured fields from this healthcare document. If a field is not present, use null or an empty array. Identify red flags like critical lab values or urgent referrals.",
            },
          ],
        },
      ],
    });

    const toolUse = extractRes.content.find((c: any) => c.type === "tool_use") as any;
    const extracted = toolUse?.input || {};

    const emergency = scanDocument(extracted);

    // Stage 2: summarize + recommend
    const sysPrompt =
      languageInstruction(language) +
      ' Always end with the disclaimer: "This is information, not medical advice. Consult a healthcare professional for your specific situation."';

    const userPrompt = `Given the following extracted health document JSON, produce:
1. A 2-3 sentence summary in plain language.
2. A "What this means for you" paragraph in plain language.
3. A "What to do next" ranked list (3-5 items) tailored to the doc_type.
   - If doc_type is "bill": tell the user they may qualify for charity care if the hospital is nonprofit, suggest negotiating, and link to Feature 4 (Get Help Applying).
   - If doc_type is "lab_report": explain abnormal flags in plain language and recommend follow-up timing. If any value is critical, surface emergency.
   - If doc_type is "prescription": mention generic alternatives and link to Feature 3 (Lower Costs).
   - If doc_type is "visit_summary": generate 3 specific questions to ask at next appointment.

Return your response as JSON with keys: summary, what_this_means, next_steps (array of strings).

Document JSON:
${JSON.stringify(extracted)}`;

    const sumRes = await claude().messages.create({
      model: POWERFUL_MODEL,
      max_tokens: 1500,
      system: sysPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = sumRes.content[0]?.type === "text" ? sumRes.content[0].text : "";
    let parsed: any = { summary: text, what_this_means: "", next_steps: [] };
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch {}
    }

    return NextResponse.json({
      doc: {
        filename: file.name,
        extracted,
        summary: parsed.summary || "",
        what_this_means: parsed.what_this_means || "",
        next_steps: parsed.next_steps || [],
      },
      emergency,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
