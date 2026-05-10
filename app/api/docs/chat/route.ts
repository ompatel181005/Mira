import { NextResponse } from "next/server";
import { claude, languageInstruction, DEFAULT_MODEL, DISCLAIMER } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, docs, language } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      docs: any[];
      language: string;
    };

    const baseInstruction =
      languageInstruction(language || "en") +
      `\nYou are helping a patient understand their healthcare documents. Cite the document name and specific values from the structured fields when answering. Use plain prose for a non-medical reader. You may use **bold** for key numbers or dates. Never output JSON, code blocks, or raw field names like "patient_responsibility" — translate them into natural phrases. Always end with: "${DISCLAIMER}"`;

    const docsText =
      docs && docs.length
        ? `Documents the user has uploaded (structured fields parsed from each):\n\n${docs
            .map(
              (d, i) =>
                `[Doc ${i + 1}: ${d.filename}]\n${JSON.stringify(d.extracted, null, 2)}`
            )
            .join("\n\n")}`
        : "";

    // Split system into a small instruction block and a larger, cacheable docs block.
    // Marking the docs block with cache_control: ephemeral lets follow-up turns reuse
    // the parsed-document context without re-billing input tokens.
    const system: any[] = [{ type: "text", text: baseInstruction }];
    if (docsText) {
      system.push({
        type: "text",
        text: docsText,
        cache_control: { type: "ephemeral" },
      });
    }

    const res = await claude().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: system as any,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const block = res.content[0];
    const text = block && block.type === "text" ? block.text : "";
    return NextResponse.json({ reply: text });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Chat error", reply: "" },
      { status: 500 }
    );
  }
}
