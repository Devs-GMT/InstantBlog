// POST /blog/edit — one-shot AI edit; returns {text, missingCitations} or {titles}.
import { Env } from "./http";
import { client, FALLBACK_BETA, mapUpstream, refusal } from "./claude";
import { EditInput, missingCitations } from "./limits";
import { buildEditUser, editSystem } from "./prompts";

export async function edit(env: Env, input: EditInput) {
  let message;
  try {
    message = await client(env).beta.messages.create({
      model: env.MODEL,
      max_tokens: 4000,
      output_config: { effort: "low" },
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: editSystem(input.brief.tone),
      messages: [{ role: "user", content: buildEditUser(input) }],
    });
  } catch (err) {
    throw mapUpstream(err);
  }
  if (message.stop_reason === "refusal") throw refusal();

  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

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
