import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export function GET() {
  const env = getEnv();
  return Response.json({ ok: true, model: env.MODEL, ai: env.MOCK_AI === "1" ? "mock" : env.GEMINI_API_KEY ? "gemini" : "missing-key" });
}
