// Shared HTTP helpers: env type, CORS, JSON + error envelope.

export interface Env {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGINS: string;
  MODEL: string;
  LIMIT_DRAFT?: string;
  LIMIT_EDIT?: string;
  LIMIT_EXTRACT?: string;
  /** Dev only: "1" returns canned AI output (no API calls). */
  MOCK_AI?: string;
  RL: KVNamespace;
}

export type ErrorCode =
  | "bad_request"
  | "forbidden_origin"
  | "not_found"
  | "too_large"
  | "unreadable"
  | "rate_limited"
  | "refusal"
  | "upstream"
  | "overloaded"
  | "internal";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export function allowedOrigin(req: Request, env: Env): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const list = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(origin) ? origin : null;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

export function json(data: unknown, status: number, origin: string | null, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders(origin), ...headers },
  });
}

export function errorResponse(err: HttpError, origin: string | null): Response {
  const headers: Record<string, string> = {};
  if (typeof err.extra.retryAfter === "number") headers["retry-after"] = String(err.extra.retryAfter);
  return json({ error: { code: err.code, message: err.message, ...err.extra } }, err.status, origin, headers);
}

const MAX_BODY = 200 * 1024;

export async function readJson<T = unknown>(req: Request): Promise<T> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY) throw new HttpError(413, "too_large", "Request is too large.");
  const text = await req.text();
  if (text.length > MAX_BODY) throw new HttpError(413, "too_large", "Request is too large.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "bad_request", "Body must be valid JSON.");
  }
}
