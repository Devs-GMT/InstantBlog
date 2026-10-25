// POST /blog/draft — streams Markdown as SSE: meta → delta* → done | error.
import { Env } from "./http";
import { client, FALLBACK_BETA, mapUpstream, usedFallback } from "./claude";
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
  let closed = false;

  const send = async (event: string, data: unknown) => {
    if (closed) return;
    try {
      await writer.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    } catch {
      closed = true; // client went away
    }
  };

  const run = async () => {
    const anthropic = client(env);
    let lastSend = Date.now();
    const ping = setInterval(() => {
      if (Date.now() - lastSend >= PING_MS) void send("ping", {});
    }, PING_MS);

    try {
      await send("meta", { model: env.MODEL, sources: input.sources.length });
      const stream = anthropic.beta.messages.stream({
        model: env.MODEL,
        max_tokens: 16000,
        output_config: { effort: "medium" },
        betas: [FALLBACK_BETA],
        fallbacks: "default",
        system: DRAFT_SYSTEM,
        messages: [{ role: "user", content: buildDraftUser(input) }],
      });
      req.signal?.addEventListener("abort", () => stream.abort());

      for await (const ev of stream) {
        if (closed) {
          stream.abort();
          break;
        }
        if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
          await send("delta", { t: ev.delta.text });
          lastSend = Date.now();
        }
      }
      if (!closed) {
        const final = await stream.finalMessage();
        await send("done", {
          stop: final.stop_reason,
          fallback: usedFallback(final.usage),
          outputTokens: final.usage.output_tokens,
        });
      }
    } catch (err) {
      if (!closed) {
        const e = mapUpstream(err);
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
