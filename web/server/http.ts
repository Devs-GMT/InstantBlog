// Shared helpers for /api route handlers: error envelope, JSON, body cap, same-origin guard, client IP.

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

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

export function errorResponse(err: unknown): Response {
  const e = err instanceof HttpError ? err : new HttpError(500, "internal", "Something went wrong.");
  const headers: Record<string, string> = {};
  if (typeof e.extra.retryAfter === "number") headers["retry-after"] = String(e.extra.retryAfter);
  return json({ error: { code: e.code, message: e.message, ...e.extra } }, e.status, headers);
}

/**
 * The API is same-origin only. Browsers always send Origin on cross-site POSTs, so reject a
 * mismatching Origin. (Non-browser clients can omit it; the per-IP rate limit covers those.)
 */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    /* invalid origin */
  }
  if (!host || originHost !== host) throw new HttpError(403, "forbidden_origin", "Origin not allowed.");
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

const MAX_BODY = 200 * 1024;

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
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

/** Wrap a route body: same-origin check, JSON errors, metadata-only logging (never bodies). */
export async function handle(route: string, req: Request, fn: () => Promise<Response>): Promise<Response> {
  const started = Date.now();
  let status = 500;
  try {
    assertSameOrigin(req);
    const res = await fn();
    status = res.status;
    return res;
  } catch (err) {
    const res = errorResponse(err);
    status = res.status;
    return res;
  } finally {
    console.log(JSON.stringify({ route, status, ms: Date.now() - started }));
  }
}
