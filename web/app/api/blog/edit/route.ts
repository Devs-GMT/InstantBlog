// POST /api/blog/edit — one-shot AI edit. docs/API.md §5
import { edit } from "@/server/edit";
import { getEnv } from "@/server/env";
import { clientIp, handle, HttpError, json, readJson } from "@/server/http";
import { parseEdit } from "@/server/limits";
import { mockEdit } from "@/server/mock";
import { checkRateLimit } from "@/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export function POST(req: Request) {
  return handle("blog/edit", req, async () => {
    const env = getEnv();
    const input = parseEdit(await readJson(req));
    await checkRateLimit("edit", clientIp(req), env);
    if (env.MOCK_AI === "1") return json(mockEdit(input));
    if (!env.GEMINI_API_KEY) throw new HttpError(503, "upstream", "The AI isn't configured on this server.");
    return json(await edit(env, input));
  });
}
