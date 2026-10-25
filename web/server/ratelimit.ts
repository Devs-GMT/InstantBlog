// Per-IP hourly counters: rl:<route>:<ip>:<yyyymmddhh>.
// Uses Upstash Redis REST when configured (shared across serverless instances), otherwise an
// in-memory map (best effort: each Vercel instance counts on its own).
import type { Env } from "./env";
import { HttpError } from "./http";

export type Route = "draft" | "edit" | "extract";

const DEFAULTS: Record<Route, number> = { draft: 10, edit: 60, extract: 40 };
const LABELS: Record<Route, string> = { draft: "drafts", edit: "AI edits", extract: "source reads" };
const TTL = 3700;

const memory = new Map<string, { n: number; exp: number }>();

function limitFor(route: Route, env: Env): number {
  const raw = { draft: env.LIMIT_DRAFT, edit: env.LIMIT_EDIT, extract: env.LIMIT_EXTRACT }[route];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULTS[route];
}

async function incr(key: string, env: Env): Promise<number> {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const res = await fetch(`${env.UPSTASH_REDIS_REST_URL.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "content-type": "application/json" },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, TTL, "NX"],
        ]),
      });
      if (res.ok) {
        const out = (await res.json()) as { result: number }[];
        return Number(out[0]?.result ?? 1);
      }
    } catch {
      /* fall back to memory */
    }
  }
  const now = Date.now();
  if (memory.size > 5000) for (const [k, v] of memory) if (v.exp < now) memory.delete(k);
  const cur = memory.get(key);
  const n = cur && cur.exp > now ? cur.n + 1 : 1;
  memory.set(key, { n, exp: now + TTL * 1000 });
  return n;
}

export async function checkRateLimit(route: Route, ip: string, env: Env): Promise<void> {
  const now = new Date();
  const bucket = now.toISOString().slice(0, 13).replace(/\D/g, ""); // yyyymmddhh (UTC)
  const limit = limitFor(route, env);
  const count = await incr(`rl:${route}:${ip}:${bucket}`, env);
  if (count > limit) {
    const nextHour = new Date(now);
    nextHour.setUTCMinutes(60, 0, 0);
    const retryAfter = Math.max(1, Math.ceil((nextHour.getTime() - now.getTime()) / 1000));
    throw new HttpError(429, "rate_limited", `You've hit the hourly limit (${limit} ${LABELS[route]}).`, { retryAfter, limit });
  }
}
