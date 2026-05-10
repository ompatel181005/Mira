import { NextResponse } from "next/server";
import { claude, languageInstruction, DEFAULT_MODEL, DISCLAIMER } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, docs, language } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
    docs: any[];
    language: string;
  };

  const system =
    languageInstruction(language || "en") +
    `\nYou are helping a patient understand their healthcare documents. Cite the document name and specific line items when answering. Always end with the disclaimer: "${DISCLAIMER}"`;

  const docContext = docs && docs.length
    ? `\n\nDocuments the user has uploaded:\n${docs
        .map((d, i) => `[Doc ${i + 1}: ${d.filename}]\n${JSON.stringify(d.extracted)}`)
        .join("\n\n")}`
    : "";

  const last = messages[messages.length - 1]?.content || "";
  const res = await claude().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    system,
    messages: [
      ...messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: last + docContext },
    ],
  });

  const text = res.content[0]?.type === "text" ? res.content[0].text : "";
  return NextResponse.json({ reply: text });
}
