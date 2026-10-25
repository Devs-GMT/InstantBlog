// POST /api/extract-url — read a public page (SSRF-guarded). docs/API.md §3
import { getEnv } from "@/server/env";
import { extractUrl } from "@/server/extract";
import { clientIp, handle, json, readJson } from "@/server/http";
import { checkRateLimit } from "@/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export function POST(req: Request) {
  return handle("extract-url", req, async () => {
    await checkRateLimit("extract", clientIp(req), getEnv());
    return json(await extractUrl(await readJson(req)));
  });
}
