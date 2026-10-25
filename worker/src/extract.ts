// POST /extract-url — fetch a public page and return its main article text.
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { HttpError } from "./http";
import { guardUrl } from "./ssrf";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_HOPS = 3;
const TIMEOUT_MS = 5000;
const MAX_WORDS = 3000;
const MIN_WORDS = 80;
const UA = "InstantBlogBot/1.0 (+https://instantblog.vercel.app)";

type Reason = "blocked_address" | "bad_url" | "timeout" | "too_large" | "not_html" | "http_error" | "empty";

const MESSAGES: Record<Reason, string> = {
  blocked_address: "That address isn't allowed.",
  bad_url: "That doesn't look like a web link.",
  timeout: "The page took too long to respond.",
  too_large: "The page is too large to read.",
  not_html: "That link isn't a web page.",
  http_error: "The page returned an error.",
  empty: "We couldn't find article text on that page.",
};

function unreadable(reason: Reason): HttpError {
  return new HttpError(422, "unreadable", MESSAGES[reason], { reason });
}

export async function extractUrl(body: { url?: unknown }) {
  if (typeof body.url !== "string" || body.url.length > 2048) {
    throw new HttpError(400, "bad_request", "url is required.");
  }
  const first = guardUrl(body.url.trim());
  if (!first.ok) throw unreadable(first.reason);

  const deadline = AbortSignal.timeout(TIMEOUT_MS);
  let current = first.url;
  let res: Response | null = null;

  try {
    for (let hop = 0; hop <= MAX_HOPS; hop++) {
      res = await fetch(current.toString(), {
        redirect: "manual",
        signal: deadline,
        headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,text/plain;q=0.8" },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc || hop === MAX_HOPS) throw unreadable("http_error");
        const next = guardUrl(loc, current);
        if (!next.ok) throw unreadable(next.reason);
        current = next.url;
        continue;
      }
      break;
    }
    if (!res || !res.ok) throw unreadable("http_error");

    const type = (res.headers.get("content-type") || "").toLowerCase();
    const isHtml = type.includes("text/html") || type.includes("application/xhtml");
    if (!isHtml && !type.includes("text/plain")) throw unreadable("not_html");
    if (Number(res.headers.get("content-length") || 0) > MAX_BYTES) throw unreadable("too_large");

    const raw = await readCapped(res);
    const charset = /charset=([^;]+)/.exec(type)?.[1]?.trim() || "utf-8";
    let decoded: string;
    try {
      decoded = new TextDecoder(charset).decode(raw);
    } catch {
      decoded = new TextDecoder("utf-8").decode(raw);
    }

    let title = current.hostname;
    let siteName: string | null = null;
    let text: string;
    if (isHtml) {
      const { document } = parseHTML(decoded);
      const article = new Readability(document as unknown as ConstructorParameters<typeof Readability>[0], { charThreshold: 300 }).parse();
      title = (article?.title || document.title || title).trim();
      siteName = article?.siteName || null;
      text = article?.textContent || document.body?.textContent || "";
    } else {
      text = decoded;
    }

    const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (words.length < MIN_WORDS) throw unreadable("empty");
    const truncated = words.length > MAX_WORDS;
    const kept = truncated ? words.slice(0, MAX_WORDS) : words;

    return {
      url: first.url.toString(),
      finalUrl: current.toString(),
      title: title.slice(0, 200),
      siteName,
      text: kept.join(" "),
      words: kept.length,
      truncated,
    };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) throw unreadable("timeout");
    throw unreadable("http_error");
  }
}

async function readCapped(res: Response): Promise<Uint8Array> {
  if (!res.body) return new Uint8Array();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw unreadable("too_large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}
