// POST /api/blog/draft — streams Markdown as SSE: meta → delta* → done | error.
import type { Env } from "./env";
import { streamText } from "./gemini";
import { HttpError } from "./http";
import type { DraftInput } from "./limits";
import { DRAFT_SYSTEM, buildDraftUser } from "./prompts";

const PING_MS = 15_000;

export function draftStream(req: Request, env: Env, input: DraftInput): Response {
  const enc = new TextEncoder();
  const upstream = new AbortController();
  req.signal?.addEventListener("abort", () => upstream.abort());

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let lastSend = Date.now();
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          lastSend = Date.now();
        } catch {
          closed = true; // client went away
          upstream.abort();
        }
      };
      const ping = setInterval(() => Date.now() - lastSend >= PING_MS && send("ping", {}), PING_MS);

      try {
        send("meta", { model: env.MODEL, sources: input.sources.length });
        const done = await streamText(env, DRAFT_SYSTEM, buildDraftUser(input), {
          // Gemini counts "thinking" tokens against this budget, so leave room above the ~2k-token article.
          maxOutputTokens: 8192,
          signal: upstream.signal,
          onText: (t) => send("delta", { t }),
        });
        send("done", { stop: done.stop, fallback: done.model !== env.MODEL, model: done.model, outputTokens: done.outputTokens });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          const e = err instanceof HttpError ? err : new HttpError(500, "internal", "Something went wrong. Try again.");
          send("error", { code: e.code, message: e.message });
          console.log(JSON.stringify({ route: "draft", error: e.code }));
        }
      } finally {
        clearInterval(ping);
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      upstream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
