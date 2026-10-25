// Approximate per-IP hourly counters in KV: rl:<route>:<ip>:<yyyymmddhh>.
import { Env, HttpError } from "./http";

export type Route = "draft" | "edit" | "extract";

const DEFAULTS: Record<Route, number> = { draft: 10, edit: 60, extract: 40 };
const LABELS: Record<Route, string> = { draft: "drafts", edit: "AI edits", extract: "source reads" };

function limitFor(route: Route, env: Env): number {
  const raw = { draft: env.LIMIT_DRAFT, edit: env.LIMIT_EDIT, extract: env.LIMIT_EXTRACT }[route];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULTS[route];
}

export async function checkRateLimit(route: Route, req: Request, env: Env): Promise<void> {
  const ip = req.headers.get("cf-connecting-ip") || "local";
  const now = new Date();
  const bucket = now.toISOString().slice(0, 13).replace(/\D/g, ""); // yyyymmddhh (UTC)
  const key = `rl:${route}:${ip}:${bucket}`;
  const limit = limitFor(route, env);

  const count = Number((await env.RL.get(key)) || 0);
  if (count >= limit) {
    const nextHour = new Date(now);
    nextHour.setUTCMinutes(60, 0, 0);
    const retryAfter = Math.max(1, Math.ceil((nextHour.getTime() - now.getTime()) / 1000));
    throw new HttpError(429, "rate_limited", `You've hit the hourly limit (${limit} ${LABELS[route]}).`, {
      retryAfter,
      limit,
    });
  }
  await env.RL.put(key, String(count + 1), { expirationTtl: 3700 });
}
