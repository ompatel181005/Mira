import Anthropic from "@anthropic-ai/sdk";

export const DEFAULT_MODEL = "claude-sonnet-4-5";
export const POWERFUL_MODEL = "claude-opus-4-5";

let _client: Anthropic | null = null;
export function claude(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const DISCLAIMER =
  "This is information, not medical advice. Consult a healthcare professional for your specific situation.";

export function languageInstruction(lang: string): string {
  const map: Record<string, string> = { en: "English", es: "Spanish", ar: "Arabic" };
  const name = map[lang] || "English";
  return `Respond entirely in ${name}. Do not translate medical terms in a way that loses precision; explain them in plain language in ${name}.`;
}

export async function quickText(prompt: string, lang = "en", model = DEFAULT_MODEL): Promise<string> {
  const res = await claude().messages.create({
    model,
    max_tokens: 1024,
    system: languageInstruction(lang),
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content[0];
  return block.type === "text" ? block.text : "";
}
