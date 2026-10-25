// POST /blog/draft — streams Markdown as SSE: meta → delta* → done | error.
import { Env, HttpError } from "./http";
import { streamText } from "./gemini";
import { DraftInput } from "./limits";
import { DRAFT_SYSTEM, buildDraftUser } from "./prompts";

const PING_MS = 15_000;

export function draft(
  req: Request,
  env: Env,
  ctx: ExecutionContext,
  input: DraftInput,
  cors: Record<string, string>,
): Response {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const upstream = new AbortController();
  let closed = false;

  const send = async (event: string, data: unknown) => {
    if (closed) return;
    try {
      await writer.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    } catch {
      closed = true; // client went away
      upstream.abort();
    }
  };

  const run = async () => {
    let lastSend = Date.now();
    const ping = setInterval(() => {
      if (Date.now() - lastSend >= PING_MS) void send("ping", {});
    }, PING_MS);
    req.signal?.addEventListener("abort", () => upstream.abort());

    try {
      await send("meta", { model: env.MODEL, sources: input.sources.length });
      const done = await streamText(env, DRAFT_SYSTEM, buildDraftUser(input), {
        // Gemini counts "thinking" tokens against this budget, so leave room above the ~2k-token article.
        maxOutputTokens: 8192,
        signal: upstream.signal,
        onText: async (t) => {
          await send("delta", { t });
          lastSend = Date.now();
        },
      });
      await send("done", { stop: done.stop, fallback: false, outputTokens: done.outputTokens });
    } catch (err) {
      if (!closed && (err as Error)?.name !== "AbortError") {
        const e = err instanceof HttpError ? err : new HttpError(500, "internal", "Something went wrong. Try again.");
        await send("error", { code: e.code, message: e.message });
      }
      console.log(JSON.stringify({ route: "draft", error: (err as Error)?.name ?? "unknown" }));
    } finally {
      clearInterval(ping);
      closed = true;
      try {
        await writer.close();
      } catch {
        /* already closed */
      }
    }
  };

  // Keep the stream producer alive after the Response is returned.
  ctx.waitUntil(run());

  return new Response(readable, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      ...cors,
    },
  });
}
