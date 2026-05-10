import { NextResponse } from "next/server";
import { claude, POWERFUL_MODEL } from "@/lib/claude";
import { scanDocument } from "@/lib/emergency";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;

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

function assessOcrQuality(extracted: any): "low" | "ok" {
  if (!extracted) return "low";
  const fields = [
    extracted.provider_name,
    extracted.date,
    (extracted.diagnoses?.length ?? 0) > 0,
    (extracted.lab_values?.length ?? 0) > 0,
    (extracted.medications?.length ?? 0) > 0,
    extracted.bill_total != null,
    extracted.patient_responsibility != null,
    extracted.due_date,
    (extracted.bill_line_items?.length ?? 0) > 0,
  ].filter(Boolean).length;

  // Anything classified "other" with <2 substantive fields is almost certainly a
  // bad photo — too dark, blurry, or cropped. Same if literally nothing extracted.
  if (extracted.doc_type === "other" && fields < 2) return "low";
  if (fields === 0) return "low";
  return "ok";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Max ${MAX_BYTES / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    const ACCEPTED_IMAGE = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
    const mediaType = isPdf
      ? "application/pdf"
      : ACCEPTED_IMAGE.has(file.type)
        ? file.type
        : "image/jpeg";
    if (!isPdf && !ACCEPTED_IMAGE.has(mediaType)) {
      return NextResponse.json(
        { error: "Unsupported image format. Please upload a JPG, PNG, or PDF." },
        { status: 415 }
      );
    }

    const docContent: any = isPdf
      ? { type: "document", source: { type: "base64", media_type: mediaType, data: bytes } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: bytes } };

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
    const ocr_quality = assessOcrQuality(extracted);

    return NextResponse.json({
      filename: file.name,
      extracted,
      emergency,
      ocr_quality,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
