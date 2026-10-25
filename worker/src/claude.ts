// Anthropic client + error mapping. Never include request text in errors or logs.
import Anthropic from "@anthropic-ai/sdk";
import { Env, ErrorCode, HttpError } from "./http";

export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export function client(env: Env): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
}

export function mapUpstream(err: unknown): HttpError {
  if (err instanceof HttpError) return err;
  if (err instanceof Anthropic.APIError) {
    const status = err.status ?? 0;
    if (status === 429 || status === 529 || status === 503) {
      return new HttpError(503, "overloaded", "The AI is busy right now. Try again in a moment.");
    }
    return new HttpError(502, "upstream", "The AI request failed. Try again.");
  }
  return new HttpError(500, "internal", "Something went wrong. Try again.");
}

export function refusal(): HttpError {
  return new HttpError(422, "refusal" as ErrorCode, "The AI couldn't write this one. Try rephrasing the topic.");
}

/** True if any fallback model ran for this response. */
export function usedFallback(usage: unknown): boolean {
  const iterations = (usage as { iterations?: { type?: string }[] } | undefined)?.iterations ?? [];
  return iterations.some((i) => i?.type === "fallback_message");
}
