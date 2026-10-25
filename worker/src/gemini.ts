// Google Gemini API client (REST, no SDK). Free tier via a Google AI Studio key.
// Docs: https://ai.google.dev/gemini-api/docs — streaming uses :streamGenerateContent?alt=sse.
import { Env, HttpError } from "./http";

const DEFAULT_BASE = "https://generativelanguage.googleapis.com/v1beta";

type Part = { text?: string; thought?: boolean };
type Chunk = {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { candidatesTokenCount?: number };
};

export type Stop = "end_turn" | "max_tokens" | "refusal";
export type Done = { stop: Stop; outputTokens: number };

const REFUSALS = new Set(["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "IMAGE_SAFETY", "OTHER"]);

function stopFrom(reason?: string): Stop | null {
  if (!reason || reason === "FINISH_REASON_UNSPECIFIED") return null;
  if (reason === "STOP") return "end_turn";
  if (reason === "MAX_TOKENS") return "max_tokens";
  return REFUSALS.has(reason) ? "refusal" : "end_turn";
}

function request(system: string, user: string, maxOutputTokens: number, temperature: number) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { maxOutputTokens, temperature },
  };
}

function url(env: Env, method: "streamGenerateContent" | "generateContent") {
  const base = (env.GEMINI_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
  return `${base}/models/${encodeURIComponent(env.MODEL)}:${method}${method === "streamGenerateContent" ? "?alt=sse" : ""}`;
}

async function call(env: Env, method: "streamGenerateContent" | "generateContent", body: unknown, signal?: AbortSignal) {
  let res: Response;
  try {
    res = await fetch(url(env, method), {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new HttpError(502, "upstream", "Couldn't reach the AI service. Try again.");
  }
  if (!res.ok) throw mapStatus(res.status);
  return res;
}

function mapStatus(status: number): HttpError {
  if (status === 429) return new HttpError(503, "overloaded", "The free AI quota is used up for the moment. Try again in a minute.");
  if (status === 503 || status === 500) return new HttpError(503, "overloaded", "The AI is busy right now. Try again in a moment.");
  return new HttpError(502, "upstream", "The AI request failed. Try again.");
}

const textOf = (c: Chunk) =>
  (c.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");

/** Stream text deltas. Calls onText for each chunk; resolves with the stop reason. */
export async function streamText(
  env: Env,
  system: string,
  user: string,
  opts: { maxOutputTokens: number; temperature?: number; signal?: AbortSignal; onText: (t: string) => Promise<void> | void },
): Promise<Done> {
  const res = await call(env, "streamGenerateContent", request(system, user, opts.maxOutputTokens, opts.temperature ?? 0.7), opts.signal);
  if (!res.body) throw new HttpError(502, "upstream", "The AI stream didn't start.");
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  let stop: Stop | null = null;
  let outputTokens = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).replace(/\r$/, "");
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      let chunk: Chunk;
      try {
        chunk = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }
      if (chunk.promptFeedback?.blockReason) return { stop: "refusal", outputTokens };
      const t = textOf(chunk);
      if (t) await opts.onText(t);
      stop = stopFrom(chunk.candidates?.[0]?.finishReason) ?? stop;
      outputTokens = chunk.usageMetadata?.candidatesTokenCount ?? outputTokens;
    }
  }
  return { stop: stop ?? "end_turn", outputTokens };
}

/** One-shot generation. */
export async function generateText(env: Env, system: string, user: string, opts: { maxOutputTokens: number; temperature?: number }) {
  const res = await call(env, "generateContent", request(system, user, opts.maxOutputTokens, opts.temperature ?? 0.4));
  const chunk = (await res.json()) as Chunk;
  if (chunk.promptFeedback?.blockReason) return { text: "", stop: "refusal" as Stop };
  return { text: textOf(chunk), stop: stopFrom(chunk.candidates?.[0]?.finishReason) ?? "end_turn" };
}
