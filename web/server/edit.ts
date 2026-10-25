// POST /api/blog/edit — one-shot AI edit; returns {text, missingCitations} or {titles}.
import type { Env } from "./env";
import { HttpError } from "./http";
import { generateText } from "./gemini";
import { EditInput, missingCitations } from "./limits";
import { buildEditUser, editSystem } from "./prompts";

export async function edit(env: Env, input: EditInput) {
  const res = await generateText(env, editSystem(input.brief.tone), buildEditUser(input), { maxOutputTokens: 4096 });
  if (res.stop === "refusal") throw new HttpError(422, "refusal", "The AI couldn't write this one. Try rephrasing.");
  const text = res.text.trim();

  if (input.action === "titles") {
    const titles = text
      .split("\n")
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    return { titles };
  }

  const cleaned = text.replace(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/i, "$1").trim();
  return {
    text: cleaned,
    missingCitations: input.selection ? missingCitations(input.selection, cleaned) : [],
  };
}
