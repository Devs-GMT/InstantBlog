# InstantBlog — Worker API Spec

Shared Cloudflare Worker (from Week 1) with three routes. TypeScript, deployed with Wrangler.

| Route | Method | Body | Response | Rate limit / IP / hour |
|---|---|---|---|---|
| `/extract-url` | POST | `{url}` | JSON | 40 |
| `/blog/draft` | POST | brief + sources | **SSE stream** | 10 |
| `/blog/edit` | POST | action + selection | JSON | 60 |
| `/health` | GET | — | `{ok:true}` | — |

---

## 1. Common rules

- **CORS:** `Access-Control-Allow-Origin: <ALLOWED_ORIGIN>` (exact match, from `env.ALLOWED_ORIGINS`, comma-separated). `OPTIONS` preflight → 204 with `Allow-Methods: POST, GET, OPTIONS` and `Allow-Headers: content-type`. Any other origin gets **403**.
- **Body:** `Content-Type: application/json`, max **200 KB** (else 413).
- **No logging of article text, selections or source text.** Log only `{route, status, code, ms}`.
- **Input cap:** about **12k tokens** in total (estimated as `chars / 4`). Draft sources are trimmed to fit (§ 4.2).
- **Rate limit:** KV key `rl:<route>:<ip>:<yyyymmddhh>` with TTL 3,700 s. The IP comes from `CF-Connecting-IP`. When over the limit, return 429 with a `Retry-After` header (seconds to the next hour).

### Error envelope (all non-2xx JSON)

```json
{ "error": { "code": "rate_limited", "message": "You've hit the hourly limit (10 drafts).", "retryAfter": 1820 } }
```

| HTTP | `code` | When |
|---|---|---|
| 400 | `bad_request` | Validation failed (field named in `message`) |
| 403 | `forbidden_origin` | CORS origin not allowed |
| 413 | `too_large` | Body > 200 KB or input over cap after trimming |
| 422 | `unreadable` | `/extract-url` couldn't read the page (with `reason`) |
| 429 | `rate_limited` | Hourly limit hit |
| 502 | `upstream` | Gemini API error |
| 503 | `overloaded` | Gemini 429 (free quota) / 500 / 503 |
| 500 | `internal` | Anything else |

---

## 2. Environment

```toml
# worker/wrangler.toml
name = "instantblog-api"
main = "src/index.ts"
compatibility_date = "2026-10-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ALLOWED_ORIGINS = "https://instantblog.vercel.app,https://instantblog-*.vercel.app"   # "*" = one label fragment (Vercel previews)
MODEL = "gemini-3.6-flash"

[[kv_namespaces]]
binding = "RL"
id = "<kv-id>"

# secret (never commit): wrangler secret put GEMINI_API_KEY   (free key: https://aistudio.google.com/apikey)
```

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

### SSRF guard (must pass before every fetch, including every redirect hop)

1. `new URL(url)`. Protocol must be `http:` or `https:`. Port must be empty, `80` or `443`. No `user:pass@`.
2. Hostname is not `localhost`, does not end with `.localhost`, `.local`, `.internal`, `.lan` or `.home.arpa`, and is not a bare single-label name.
3. If the hostname is an IP literal (v4, v6 or `[…]`), reject `0.0.0.0/8`, `10/8`, `100.64/10`, `127/8`, `169.254/16`, `172.16/12`, `192.0.0/24`, `192.168/16`, `198.18/15`, `224/4` and up, `::`, `::1`, `fc00::/7`, `fe80::/10` and `::ffff:<blocked v4>`. Also reject decimal, hex and octal IPv4 forms (e.g. `2130706433`, `0x7f.1`). Normalise with `new URL` first, then test.
4. `fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000), headers: { "user-agent": "InstantBlogBot/1.0 (+https://instantblog.vercel.app)", accept: "text/html,text/plain" } })`. Never forward client cookies or headers.
5. On 3xx, read `Location`, resolve it against the current URL, and go back to step 1. Max **3 hops**.
6. `content-type` must start with `text/html` or `text/plain`.
7. Read the body through a reader and abort after **2 MB**.
8. HTML: `parseHTML(html)` (linkedom) → `new Readability(document).parse()`. Use `article.textContent`, collapse whitespace and trim to 3,000 words (`truncated: true` if cut). If there are fewer than 80 words → `unreadable/empty`.

> Cloudflare's network won't route Worker `fetch` to RFC 1918 space anyway, but the explicit guard gives clear error messages and defends against odd encodings.

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

**Client:** `fetch` + `res.body.getReader()` + a small SSE line parser (EventSource can't POST). `AbortController` powers **[Stop]**. The Worker passes the abort upstream (`request.signal` → `stream.abort()`).

### 4.4 Implementation (`worker/src/draft.ts` + `worker/src/gemini.ts`)

Gemini REST, no SDK: `POST {GEMINI_BASE_URL}/models/{MODEL}:streamGenerateContent?alt=sse` with header `x-goog-api-key` and body

```json
{
  "systemInstruction": { "parts": [{ "text": "<DRAFT_SYSTEM>" }] },
  "contents": [{ "role": "user", "parts": [{ "text": "<brief + sources>" }] }],
  "generationConfig": { "maxOutputTokens": 8192, "temperature": 0.7 }
}
```

Gemini answers with SSE lines `data: {"candidates":[{"content":{"parts":[{"text":"…"}]},"finishReason":"STOP"}],"usageMetadata":{…}}`. The Worker re-emits each text part as our own `delta` event, so the client protocol above doesn't depend on the provider.

Notes:

- **Thought parts are dropped.** Parts with `"thought": true` (model reasoning, if ever returned) never reach the article.
- **Finish reasons:** `STOP` → `end_turn`; `MAX_TOKENS` → `max_tokens`; `SAFETY`, `RECITATION`, `BLOCKLIST`, `PROHIBITED_CONTENT`, `SPII` → `refusal`; `promptFeedback.blockReason` → `refusal`. The UI shows the "AI couldn't write this one" state for `refusal`.
- **`maxOutputTokens` includes thinking tokens** on Gemini 2.5+ models, so it's set well above the ~2k-token article (8,192).
- **Abort:** `request.signal` and a failed write to the client both abort the upstream fetch.
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

Post-check (Worker): for actions with a selection, compute which `[n]` markers are in the selection but missing from the output and return them as `"missingCitations": [2]`. The UI warns with that list (PRD E-6).

---

## 6. Client wrapper (`web/js/api.js`)

```js
export async function streamDraft(payload, { onMeta, onDelta, onDone, onError, signal }) {
  const res = await fetch(`${CONFIG.WORKER_URL}/blog/draft`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(payload), signal,
  });
  if (!res.ok) return onError(await res.json().catch(() => ({ error: { code: "internal" } })));
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, i); buf = buf.slice(i + 2);
      const ev = /^event: (.+)$/m.exec(raw)?.[1];
      const data = JSON.parse(/^data: (.*)$/m.exec(raw)?.[1] ?? "{}");
      ({ meta: onMeta, delta: d => onDelta(d.t), done: onDone, error: onError })[ev]?.(data);
    }
  }
}
```

---

## 7. LLM configuration

Provider: **Google Gemini API** (Google AI Studio key, free tier). Model from the `MODEL` var, default `gemini-3.6-flash`.

| Route | Endpoint | maxOutputTokens | Temperature | Stream |
|---|---|---|---|---|
| draft | `:streamGenerateContent?alt=sse` | 8,192 | 0.7 | yes |
| edit (all actions) | `:generateContent` | 4,096 | 0.4 | no |

- **Free tier:** Flash / Flash-Lite models only; Pro models are paid. Limits are per project (requests per minute and per day) and Google changes them; check the live quota in AI Studio. Our own per-IP limits (10 drafts, 60 edits per hour) sit in front of that.
- **Data use on the free tier:** Google's terms allow it to use free-tier inputs and outputs to improve its products, and human reviewers may read them. The Privacy page and FAQ say so. Don't put anything confidential in a brief while on the free tier; switching the AI Studio project to a paid plan changes this.
- **Changing the model:** `MODEL` is a plain var in `wrangler.toml`, so a newer Flash model is a config change. List the models your key can use with `curl -H "x-goog-api-key: $KEY" https://generativelanguage.googleapis.com/v1beta/models`.
- The prompts are static strings (`worker/src/prompts.ts`) and provider-neutral.

---

## 8. Worker test commands

```bash
# health
curl -s $W/health
# extract
curl -s -X POST $W/extract-url -H 'content-type: application/json' -H "origin: $SITE" -d '{"url":"https://en.wikipedia.org/wiki/Hackathon"}' | jq .title,.words
# SSRF must fail with 422 blocked_address
for u in http://localhost http://127.0.0.1 http://2130706433 http://[::1] http://169.254.169.254/latest/meta-data http://10.0.0.1 http://foo.internal; do
  curl -s -X POST $W/extract-url -H 'content-type: application/json' -H "origin: $SITE" -d "{\"url\":\"$u\"}" | jq -c .error.reason; done
# draft stream
curl -N -X POST $W/blog/draft -H 'content-type: application/json' -H "origin: $SITE" -d @fixtures/draft.json
# CORS reject
curl -s -o /dev/null -w '%{http_code}\n' -X POST $W/blog/edit -H 'origin: https://evil.example' -d '{}'
```
