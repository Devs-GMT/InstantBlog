// Google Gemini API client (REST, no SDK). Free tier via a Google AI Studio key.
// Docs: https://ai.google.dev/gemini-api/docs — streaming uses :streamGenerateContent?alt=sse.
import type { Env } from "./env";
import { HttpError } from "./http";

const DEFAULT_BASE = "https://generativelanguage.googleapis.com/v1beta";

type Part = { text?: string; thought?: boolean };
type Chunk = {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { candidatesTokenCount?: number };
};

export type Stop = "end_turn" | "max_tokens" | "refusal";
export type Done = { stop: Stop; outputTokens: number; model: string };

const REFUSALS = new Set(["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "IMAGE_SAFETY", "OTHER"]);

function stopFrom(reason?: string): Stop | null {
  if (!reason || reason === "FINISH_REASON_UNSPECIFIED") return null;
  if (reason === "STOP") return "end_turn";
  if (reason === "MAX_TOKENS") return "max_tokens";
  return REFUSALS.has(reason) ? "refusal" : "end_turn";
}

// No temperature override: Google recommends the default (1.0) for Gemini 3 models; lower values can cause looping.
function request(model: string, system: string, user: string, maxOutputTokens: number) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      maxOutputTokens,
      // Gemini 3 thinks before answering; "low" cuts time-to-first-token a lot for writing tasks.
      ...(/^gemini-3/.test(model) ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
    },
  };
}

function url(env: Env, model: string, method: Method) {
  const base = (env.GEMINI_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
  return `${base}/models/${encodeURIComponent(model)}:${method}${method === "streamGenerateContent" ? "?alt=sse" : ""}`;
}

type Method = "streamGenerateContent" | "generateContent";

// Free tier limits are per model (e.g. gemini-3.6-flash: ~5 requests/min and only 20/day) and Gemini sometimes
// answers 500/503 under load. Before any output is sent: retry briefly, and when the main model is out of
// quota, fall back to GEMINI_FALLBACK_MODEL (a Flash-Lite model with its own, larger quota).
const RETRY_STATUS = new Set([429, 500, 503]);
const BACKOFF_MS = [1500, 4000];

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), reject(Object.assign(new Error("aborted"), { name: "AbortError" }))), { once: true });
  });
}

/** True when a 429 is a per-day quota (waiting a few seconds won't help). */
async function isDailyQuota(res: Response): Promise<boolean> {
  try {
    const j = (await res.json()) as { error?: { details?: { violations?: { quotaId?: string }[] }[] } };
    return (j.error?.details ?? []).some((d) => (d.violations ?? []).some((v) => /PerDay/i.test(v.quotaId ?? "")));
  } catch {
    return false;
  }
}

async function call(env: Env, method: Method, makeBody: (model: string) => unknown, signal?: AbortSignal) {
  const models = [env.MODEL, ...(env.FALLBACK_MODEL && env.FALLBACK_MODEL !== env.MODEL ? [env.FALLBACK_MODEL] : [])];
  let lastStatus = 0;
  for (const model of models) {
    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await fetch(url(env, model, method), {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
          body: JSON.stringify(makeBody(model)),
          signal,
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") throw err;
        if (attempt < BACKOFF_MS.length) {
          await wait(BACKOFF_MS[attempt], signal);
          continue;
        }
        lastStatus = 502;
        break;
      }
      if (res.ok) return { res, model };
      lastStatus = res.status;
      if (!RETRY_STATUS.has(res.status)) throw mapStatus(res.status);
      if (res.status === 429 && (await isDailyQuota(res))) break; // next model right away
      await res.body?.cancel().catch(() => {});
      if (attempt < BACKOFF_MS.length) {
        await wait(BACKOFF_MS[attempt], signal);
        continue;
      }
      break; // retries used up → next model
    }
  }
  throw mapStatus(lastStatus);
}

function mapStatus(status: number): HttpError {
  if (status === 429) return new HttpError(503, "overloaded", "The free AI quota is used up for the moment. Try again later.");
  if (status === 503 || status === 500) return new HttpError(503, "overloaded", "The AI is busy right now. Try again in a moment.");
  if (status === 502) return new HttpError(502, "upstream", "Couldn't reach the AI service. Try again.");
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
  opts: { maxOutputTokens: number; signal?: AbortSignal; onText: (t: string) => Promise<void> | void },
): Promise<Done> {
  const { res, model } = await call(env, "streamGenerateContent", (m) => request(m, system, user, opts.maxOutputTokens), opts.signal);
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
      if (chunk.promptFeedback?.blockReason) return { stop: "refusal", outputTokens, model };
      const t = textOf(chunk);
      if (t) await opts.onText(t);
      stop = stopFrom(chunk.candidates?.[0]?.finishReason) ?? stop;
      outputTokens = chunk.usageMetadata?.candidatesTokenCount ?? outputTokens;
    }
  }
  return { stop: stop ?? "end_turn", outputTokens, model };
}

/** One-shot generation. */
export async function generateText(env: Env, system: string, user: string, opts: { maxOutputTokens: number }) {
  const { res } = await call(env, "generateContent", (m) => request(m, system, user, opts.maxOutputTokens));
  const chunk = (await res.json()) as Chunk;
  if (chunk.promptFeedback?.blockReason) return { text: "", stop: "refusal" as Stop };
  return { text: textOf(chunk), stop: stopFrom(chunk.candidates?.[0]?.finishReason) ?? "end_turn" };
}
