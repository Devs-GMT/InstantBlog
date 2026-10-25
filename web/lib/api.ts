// Worker client: /extract-url, /blog/draft (SSE over fetch), /blog/edit. docs/WORKER_API.md.
import { CONFIG } from "./config";

export class ApiError extends Error {
  code: string;
  reason?: string;
  retryAfter?: number;
  constructor(code: string, message: string, extra: { reason?: string; retryAfter?: number } = {}) {
    super(message);
    this.code = code;
    this.reason = extra.reason;
    this.retryAfter = extra.retryAfter;
  }
}

type ErrorPayload = { error?: { code?: string; message?: string; reason?: string; retryAfter?: number } } | null;

const MESSAGES: Record<string, (e: NonNullable<ErrorPayload>["error"]) => string> = {
  rate_limited: (e) => `${e?.message || "You've hit the hourly limit."} Try again in ${Math.max(1, Math.ceil((e?.retryAfter || 60) / 60))} min.`,
  overloaded: () => "The AI is busy right now.",
  upstream: () => "The AI request failed.",
  refusal: () => "The AI couldn't write this one. Try rephrasing the topic.",
  too_large: () => "That's too much text for one request. Try fewer or shorter sources.",
  network: () => "You seem to be offline, or the server can't be reached. Your draft is safe.",
};

function toApiError(payload: ErrorPayload, fallbackCode = "internal") {
  const e = payload?.error ?? {};
  const code = e.code || fallbackCode;
  const message = MESSAGES[code] ? MESSAGES[code](e) : e.message || "Something went wrong.";
  return new ApiError(code, message, { reason: e.reason, retryAfter: e.retryAfter });
}

async function post(path: string, body: unknown, signal?: AbortSignal) {
  let res: Response;
  try {
    res = await fetch(CONFIG.WORKER_URL + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError("network", MESSAGES.network({}));
  }
  if (!res.ok) throw toApiError(await res.json().catch(() => null));
  return res;
}

export type ExtractResult = { url: string; finalUrl: string; title: string; siteName: string | null; text: string; words: number; truncated: boolean };

export async function extractUrl(url: string, signal?: AbortSignal): Promise<ExtractResult> {
  return (await post("/extract-url", { url }, signal)).json();
}

export type EditAction = "rewrite" | "shorten" | "expand" | "tone" | "simplify" | "grammar" | "intro" | "conclusion" | "titles" | "section";
export type EditResult = { text?: string; missingCitations?: number[]; titles?: string[] };

export async function editText(payload: Record<string, unknown>, signal?: AbortSignal): Promise<EditResult> {
  return (await post("/blog/edit", payload, signal)).json();
}

export type DraftDone = { stop: string; fallback: boolean; outputTokens: number };

/** Stream a draft over SSE. Throws ApiError on failure; abort with the signal. */
export async function streamDraft(
  payload: Record<string, unknown>,
  h: { onMeta?: (m: { model: string; sources: number }) => void; onDelta: (t: string) => void; onDone?: (d: DraftDone) => void; signal?: AbortSignal },
) {
  const res = await post("/blog/draft", payload, h.signal);
  if (!res.body) throw new ApiError("upstream", "The draft stream didn't start.");
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  let finished = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const event = /^event: (.+)$/m.exec(raw)?.[1];
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(/^data: (.*)$/m.exec(raw)?.[1] ?? "{}");
      } catch {
        continue;
      }
      if (event === "meta") h.onMeta?.(data as { model: string; sources: number });
      else if (event === "delta") h.onDelta(String(data.t ?? ""));
      else if (event === "done") {
        finished = true;
        h.onDone?.(data as unknown as DraftDone);
      } else if (event === "error") throw toApiError({ error: data as NonNullable<ErrorPayload>["error"] }, "upstream");
    }
  }
  if (!finished) throw new ApiError("upstream", "The draft stream ended early.");
}
