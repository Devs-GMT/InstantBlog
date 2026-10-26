// Server-only configuration (never import from client components). Set in .env.local / Vercel env vars.

export interface Env {
  GEMINI_API_KEY: string;
  MODEL: string;
  /** Used when MODEL is out of free quota or overloaded. Empty string disables. */
  FALLBACK_MODEL: string;
  /** Optional override, e.g. a local fake Gemini server in tests. */
  GEMINI_BASE_URL?: string;
  LIMIT_DRAFT?: string;
  LIMIT_EDIT?: string;
  LIMIT_EXTRACT?: string;
  /** Dev only: "1" returns canned AI output (no API calls). Never set in production. */
  MOCK_AI?: string;
  /** Optional: Upstash Redis REST for rate limits shared across serverless instances. */
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

export function getEnv(): Env {
  const e = process.env;
  return {
    GEMINI_API_KEY: e.GEMINI_API_KEY || "",
    MODEL: e.GEMINI_MODEL || "gemini-3.6-flash",
    FALLBACK_MODEL: e.GEMINI_FALLBACK_MODEL ?? "gemini-3.5-flash-lite",
    GEMINI_BASE_URL: e.GEMINI_BASE_URL,
    LIMIT_DRAFT: e.LIMIT_DRAFT,
    LIMIT_EDIT: e.LIMIT_EDIT,
    LIMIT_EXTRACT: e.LIMIT_EXTRACT,
    MOCK_AI: e.MOCK_AI,
    UPSTASH_REDIS_REST_URL: e.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: e.UPSTASH_REDIS_REST_TOKEN,
  };
}
