// POST /api/blog/draft — streamed draft (SSE). docs/API.md §4
import { draftStream } from "@/server/draft";
import { getEnv } from "@/server/env";
import { clientIp, handle, HttpError, readJson } from "@/server/http";
import { parseDraft } from "@/server/limits";
import { mockDraftStream } from "@/server/mock";
import { checkRateLimit } from "@/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function POST(req: Request) {
  return handle("blog/draft", req, async () => {
    const env = getEnv();
    const input = parseDraft(await readJson(req));
    await checkRateLimit("draft", clientIp(req), env);
    if (env.MOCK_AI === "1") return mockDraftStream(input);
    if (!env.GEMINI_API_KEY) throw new HttpError(503, "upstream", "The AI isn't configured on this server.");
    return draftStream(req, env, input);
  });
}
