// InstantBlog API Worker — /health · /extract-url · /blog/draft (SSE) · /blog/edit
import { Env, HttpError, allowedOrigin, corsHeaders, errorResponse, json, readJson } from "./http";
import { checkRateLimit } from "./ratelimit";
import { extractUrl } from "./extract";
import { draft } from "./draft";
import { edit } from "./edit";
import { parseDraft, parseEdit } from "./limits";
import { mockDraftStream, mockEdit } from "./mock";

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const origin = allowedOrigin(req, env);
    const started = Date.now();
    let status = 500;
    let code = "ok";

    try {
      if (url.pathname === "/health" && req.method === "GET") {
        status = 200;
        return json({ ok: true }, 200, origin);
      }

      if (!origin) throw new HttpError(403, "forbidden_origin", "Origin not allowed.");

      if (req.method === "OPTIONS") {
        status = 204;
        return new Response(null, { status: 204, headers: corsHeaders(origin) });
      }
      if (req.method !== "POST") throw new HttpError(404, "not_found", "Not found.");

      switch (url.pathname) {
        case "/extract-url": {
          await checkRateLimit("extract", req, env);
          const body = await readJson<Record<string, unknown>>(req);
          const result = await extractUrl(body);
          status = 200;
          return json(result, 200, origin);
        }
        case "/blog/draft": {
          const body = await readJson<Record<string, unknown>>(req);
          const input = parseDraft(body);
          await checkRateLimit("draft", req, env);
          status = 200;
          if (env.MOCK_AI === "1") return mockDraftStream(input, corsHeaders(origin));
          return draft(req, env, ctx, input, corsHeaders(origin));
        }
        case "/blog/edit": {
          const body = await readJson<Record<string, unknown>>(req);
          const input = parseEdit(body);
          await checkRateLimit("edit", req, env);
          const result = env.MOCK_AI === "1" ? mockEdit(input) : await edit(env, input);
          status = 200;
          return json(result, 200, origin);
        }
        default:
          throw new HttpError(404, "not_found", "Not found.");
      }
    } catch (err) {
      const e = err instanceof HttpError ? err : new HttpError(500, "internal", "Something went wrong.");
      status = e.status;
      code = e.code;
      return errorResponse(e, origin);
    } finally {
      // Never log bodies — route, status, code and timing only.
      console.log(JSON.stringify({ route: url.pathname, status, code, ms: Date.now() - started }));
    }
  },
} satisfies ExportedHandler<Env>;
