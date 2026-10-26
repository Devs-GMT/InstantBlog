# InstantBlog — API Spec

Route handlers inside the Next.js app (`web/app/api/*/route.ts`, logic in `web/server/`), deployed with the site on Vercel. Node runtime, same origin as the pages.

| Route | Method | Body | Response | Rate limit / IP / hour |
|---|---|---|---|---|
| `/api/extract-url/` | POST | `{url}` | JSON | 40 |
| `/api/blog/draft/` | POST | brief + sources | **SSE stream** | 10 |
| `/api/blog/edit/` | POST | action + selection | JSON | 60 |
| `/api/health/` | GET | — | `{ok, model, ai: "gemini" \| "mock" \| "missing-key"}` | — |

Paths end with `/` because the app uses `trailingSlash: true` (without it the request gets a 308 redirect first).

---

## 1. Common rules

- **Same origin only:** no CORS headers. If an `Origin` header is present it must match the request host, else **403** (`assertSameOrigin` in `web/server/http.ts`). Browsers always send `Origin` on cross-site POSTs; non-browser clients are covered by the rate limit.
- **Body:** `Content-Type: application/json`, max **200 KB** (else 413).
- **No logging of article text, selections or source text.** Log only `{route, status, code, ms}`.
- **Input cap:** about **12k tokens** in total (estimated as `chars / 4`). Draft sources are trimmed to fit (§ 4.2).
- **Rate limit:** key `rl:<route>:<ip>:<yyyymmddhh>`, TTL 3,700 s. Stored in **Upstash Redis** (REST `INCR` + `EXPIRE`) when `UPSTASH_REDIS_REST_URL`/`_TOKEN` are set, otherwise in memory per server instance (best effort on serverless). IP from `x-real-ip` / `x-forwarded-for` (set by Vercel). Over the limit → 429 with `Retry-After` (seconds to the next hour).

### Error envelope (all non-2xx JSON)

```json
{ "error": { "code": "rate_limited", "message": "You've hit the hourly limit (10 drafts).", "retryAfter": 1820 } }
```

| HTTP | `code` | When |
|---|---|---|
| 400 | `bad_request` | Validation failed (field named in `message`) |
| 403 | `forbidden_origin` | `Origin` doesn't match the host |
| 413 | `too_large` | Body > 200 KB or input over cap after trimming |
| 422 | `unreadable` | `/extract-url` couldn't read the page (with `reason`) |
| 429 | `rate_limited` | Hourly limit hit |
| 502 | `upstream` | Gemini API error |
| 503 | `overloaded` | Gemini 429 (free quota) / 500 / 503 |
| 500 | `internal` | Anything else |

---

## 2. Environment

Server-only env vars (read in `web/server/env.ts`; local: `web/.env.local`, production: Vercel → Settings → Environment Variables):

| Var | Required | Default | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | yes | — | Google AI Studio key (free: https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | no | `gemini-3.6-flash` | Main model (list: `GET /v1beta/models`) |
| `GEMINI_FALLBACK_MODEL` | no | `gemini-3.5-flash-lite` | Used when the main model is out of quota or overloaded; empty = no fallback |
| `LIMIT_DRAFT` / `LIMIT_EDIT` / `LIMIT_EXTRACT` | no | 10 / 60 / 40 | Per-IP hourly limits |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | no | — | Shared rate-limit store across serverless instances |
| `MOCK_AI` | dev only | — | `1` = canned AI output, no API calls. **Never in production.** |
| `GEMINI_BASE_URL` | tests only | Google's endpoint | Point at a fake Gemini server |

Route config: `runtime = "nodejs"`, `dynamic = "force-dynamic"`, `maxDuration` 60 s (draft) / 30 s (edit, extract).

---

## 3. `POST /extract-url`

**Request** `{ "url": "https://example.com/post" }`

**Response 200**

```json
{ "url": "https://example.com/post", "finalUrl": "https://example.com/post",
  "title": "Why small teams ship faster", "siteName": "Example",
  "text": "…main article text, ≤ 3,000 words…", "words": 2140, "truncated": false }
```

**Response 422** `{ "error": { "code": "unreadable", "reason": "blocked_address" | "timeout" | "too_large" | "not_html" | "http_error" | "empty", "message": "…" } }`

### SSRF guard (URL check + resolved-IP check on every hop)

1. `new URL(url)`. Protocol must be `http:` or `https:`. Port must be empty, `80` or `443`. No `user:pass@`.
2. Hostname is not `localhost`, does not end with `.localhost`, `.local`, `.internal`, `.lan` or `.home.arpa`, and is not a bare single-label name.
3. If the hostname is an IP literal (v4, v6 or `[…]`), reject `0.0.0.0/8`, `10/8`, `100.64/10`, `127/8`, `169.254/16`, `172.16/12`, `192.0.0/24`, `192.168/16`, `198.18/15`, `224/4` and up, `::`, `::1`, `fc00::/7`, `fe80::/10` and `::ffff:<blocked v4>`. Also reject decimal, hex and octal IPv4 forms (e.g. `2130706433`, `0x7f.1`). Normalise with `new URL` first, then test.
4. `safeFetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000), … })` (`web/server/safeFetch.ts`): an undici `Agent` whose `connect.lookup` resolves the hostname and **refuses to connect if any resolved address is blocked** (same ranges as step 3). This covers hostnames that point inward (`localtest.me`, `127.0.0.1.nip.io`) and DNS rebinding. Never forward client cookies or headers.
5. On 3xx, read `Location`, resolve it against the current URL, and go back to step 1. Max **3 hops**.
6. `content-type` must start with `text/html` or `text/plain`.
7. Read the body through a reader and abort after **2 MB**.
8. HTML: `parseHTML(html)` (linkedom) → `new Readability(document).parse()`. Use `article.textContent`, collapse whitespace and trim to 3,000 words (`truncated: true` if cut). If there are fewer than 80 words → `unreadable/empty`.

> On Vercel (AWS) internal addresses such as the cloud metadata IP `169.254.169.254` could be reachable from a function, so the connect-time IP check is required, not optional.

---

## 4. `POST /blog/draft` (streamed)

### 4.1 Request

```json
{
  "topic": "Why small dApps win hackathons",
  "type": "blog",                  // blog | article | howto | listicle | opinion
  "tone": 0,                       // 0..5 (Friendly … Casual)
  "length": "medium",              // short | medium | long
  "points": ["Scope is a feature", "Demo beats docs", "Judges reward clarity"],
  "audience": "beginner developers",
  "sources": [
    { "n": 1, "title": "…", "url": "https://…", "text": "…" },
    { "n": 2, "title": "Pasted source", "url": null, "text": "…" }
  ]
}
```

**Validation:** topic 5–160 chars · type/tone/length in their enums · points 3–5 items, each 1–200 chars · audience ≤ 80 · sources ≤ 5, `n` = 1..5 unique, text ≤ 25,000 chars each.

### 4.2 Source budget

The total source text must fit in **~40,000 chars** (~10k tokens). If it's over, trim each source to `floor(40000 / count)` chars at a sentence boundary. Prompt + brief take the remaining ~2k tokens.

### 4.3 Response — `text/event-stream`

```
event: meta
data: {"model":"gemini-3.6-flash","sources":3}

event: delta
data: {"t":"# Why small dApps win hackathons\n<!-- titles: … -->\n\n"}

event: delta
data: {"t":"Hackathons reward…"}

event: done
data: {"stop":"end_turn","fallback":false,"outputTokens":1650}
```

| Event | Meaning |
|---|---|
| `meta` | Sent first, right away (so the UI can show "Writing…") |
| `delta` | `{t}` text chunk to append |
| `ping` | `{}` every 15 s if no deltas (keeps proxies open) |
| `done` | `stop` ∈ `end_turn` / `max_tokens` (UI shows "Draft was cut off — [Continue]" for MVP+1; for MVP shows a warning) / `refusal` |
| `error` | `{code, message}`. The stream ends after it. |

Headers: `content-type: text/event-stream; charset=utf-8`, `cache-control: no-cache`, plus the CORS headers.

**Client:** `fetch` + `res.body.getReader()` + a small SSE line parser (EventSource can't POST). `AbortController` powers **[Stop]**. The server passes the abort upstream to Gemini.

### 4.4 Implementation (`web/server/draft.ts` + `web/server/gemini.ts`)

Gemini REST, no SDK: `POST {GEMINI_BASE_URL}/models/{MODEL}:streamGenerateContent?alt=sse` with header `x-goog-api-key` and body

```json
{
  "systemInstruction": { "parts": [{ "text": "<DRAFT_SYSTEM>" }] },
  "contents": [{ "role": "user", "parts": [{ "text": "<brief + sources>" }] }],
  "generationConfig": { "maxOutputTokens": 8192, "temperature": 0.7 }
}
```

Gemini answers with SSE lines `data: {"candidates":[{"content":{"parts":[{"text":"…"}]},"finishReason":"STOP"}],"usageMetadata":{…}}`. The route re-emits each text part as our own `delta` event, so the client protocol above doesn't depend on the provider.

Notes:

- **Thought parts are dropped.** Parts with `"thought": true` (model reasoning, if ever returned) never reach the article.
- **Finish reasons:** `STOP` → `end_turn`; `MAX_TOKENS` → `max_tokens`; `SAFETY`, `RECITATION`, `BLOCKLIST`, `PROHIBITED_CONTENT`, `SPII` → `refusal`; `promptFeedback.blockReason` → `refusal`. The UI shows the "AI couldn't write this one" state for `refusal`.
- **`maxOutputTokens` includes thinking tokens** on Gemini 2.5+ models, so it's set well above the ~2k-token article (8,192).
- **Abort:** `request.signal`, stream `cancel()` and a failed `enqueue()` all abort the upstream fetch. `enqueue()` errors are swallowed: an unhandled rejection after a client disconnect would crash the Node server.
- **Upstream errors:** 429 (free quota) → `overloaded` "The free AI quota is used up for the moment…"; 500/503 → `overloaded`; others → `upstream`. No request text in errors or logs.
- **Local testing without a key:** set `GEMINI_BASE_URL` to a fake server that speaks the same wire format (used in development), or `MOCK_AI=1` for canned output.

---

## 5. `POST /blog/edit`

### 5.1 Request

```json
{
  "action": "shorten",            // rewrite | shorten | expand | tone | simplify | grammar | intro | conclusion | titles | section
  "selection": "…selected text with [1] citations…",
  "paragraph": "…the full paragraph(s) around it…",
  "tone": 2,                      // required for action=tone; else brief tone
  "sectionTopic": "common mistakes",   // required for action=section
  "brief": { "topic": "…", "type": "blog", "tone": 0, "audience": "…", "points": ["…"] },
  "outline": ["Intro", "Scope is a feature", "Demo beats docs", "Conclusion"],   // H2 list, for intro/conclusion/titles/section
  "sources": [{ "n": 1, "title": "…", "text": "…" }]   // optional, only for expand/section (trimmed to 12k chars total)
}
```

**Caps:** selection ≤ 6,000 chars · paragraph ≤ 8,000 chars · total ≤ 12k tokens estimated.

### 5.2 Response 200

```json
{ "text": "…replacement Markdown…" }            // all actions except titles
{ "titles": ["…", "…", "…"] }                     // action = titles
```

Implementation: non-streaming `POST …/models/{MODEL}:generateContent` with `maxOutputTokens: 4096`, temperature 0.4. Text parts only (thought parts dropped). For `titles`, split the output into lines, strip numbering and quotes, and take 3.

Post-check (server): for actions with a selection, compute which `[n]` markers are in the selection but missing from the output and return them as `"missingCitations": [2]`. The UI warns with that list (PRD E-6).

---

## 6. Client wrapper (`web/lib/api.ts`)

`streamDraft()` uses `fetch` + `res.body.getReader()` + a small SSE line parser (EventSource can't POST); `extractUrl()` and `editText()` are plain JSON POSTs. Base URL is `CONFIG.API_BASE` (empty = same origin).

---

## 7. LLM configuration

Provider: **Google Gemini API** (Google AI Studio key, free tier). Model from the `MODEL` var, default `gemini-3.6-flash`.

| Route | Endpoint | maxOutputTokens | Temperature | Stream |
|---|---|---|---|---|
| draft | `:streamGenerateContent?alt=sse` | 8,192 | 0.7 | yes |
| edit (all actions) | `:generateContent` | 4,096 | 0.4 | no |

- **Free tier:** Flash / Flash-Lite models only; Pro models are paid. Limits are **per model** per project and Google changes them. Measured on 2026-10-26: `gemini-3.6-flash` ≈ 5 requests/minute and **20 requests/day**; Flash-Lite models have their own, larger quota. Our per-IP limits (10 drafts, 60 edits per hour) sit in front of that.
- **Retries and fallback (`web/server/gemini.ts`):** before any output is sent, 429/500/503 and network errors are retried with backoff (1.5 s, 4 s). A 429 whose quota id contains `PerDay` skips the retries. When the main model still fails, the request is repeated on `GEMINI_FALLBACK_MODEL`. The draft's `done` event reports `model` and `fallback: true` when that happened. Only if every model fails does the user see "The free AI quota is used up for the moment" or "The AI is busy right now".
- **Data use on the free tier:** Google's terms allow it to use free-tier inputs and outputs to improve its products, and human reviewers may read them. The Privacy page and FAQ say so. Don't put anything confidential in a brief while on the free tier; switching the AI Studio project to a paid plan changes this.
- **Changing the model:** set `GEMINI_MODEL` (Vercel env var) and redeploy; no code change. List the models your key can use with `curl -H "x-goog-api-key: $KEY" https://generativelanguage.googleapis.com/v1beta/models`.
- The prompts are static strings (`web/server/prompts.ts`) and provider-neutral.

---

## 8. API test commands

Run against a server on :3000 (`pnpm dev`, or `pnpm build && pnpm start`). Start it with `MOCK_AI=1` for deterministic drafts.

```bash
B=http://localhost:3000; H="content-type: application/json"
curl -s $B/api/health/
curl -s -X POST $B/api/extract-url/ -H "$H" -d '{"url":"https://en.wikipedia.org/wiki/Hackathon"}' | jq .title,.words
# SSRF must fail with 422 blocked_address (literal IPs, inward hostnames)
for u in http://localhost http://127.0.0.1 http://2130706433 http://[::1] http://169.254.169.254/latest/meta-data http://10.0.0.1 http://foo.internal http://localtest.me http://127.0.0.1.nip.io; do
  curl -s -X POST $B/api/extract-url/ -H "$H" -d "{\"url\":\"$u\"}" | jq -c .error.reason; done
# draft stream
curl -N -X POST $B/api/blog/draft/ -H "$H" -d @fixtures/draft.json
# cross-origin reject → 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST $B/api/blog/edit/ -H "$H" -H 'origin: https://evil.example' -d '{}'
# aborted streams must not crash the server
for i in 1 2 3; do curl -s -N -m 0.3 -X POST $B/api/blog/draft/ -H "$H" -d @fixtures/draft.json -o /dev/null; done; curl -s $B/api/health/
```
