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
| 502 | `upstream` | Claude/API error |
| 503 | `overloaded` | Upstream 529/overloaded |
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
ALLOWED_ORIGINS = "https://instantblog.xyz,https://<user>.github.io"
MODEL = "claude-opus-5-5"

[[kv_namespaces]]
binding = "RL"
id = "<kv-id>"

# secret (never commit): wrangler secret put ANTHROPIC_API_KEY
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
4. `fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000), headers: { "user-agent": "InstantBlogBot/1.0 (+https://instantblog.xyz)", accept: "text/html,text/plain" } })`. Never forward client cookies or headers.
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
data: {"model":"claude-opus-5-5","sources":3}

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

### 4.4 Implementation sketch

```ts
// worker/src/draft.ts
import Anthropic from "@anthropic-ai/sdk";
import { DRAFT_SYSTEM, buildDraftUser } from "./prompts";

export async function draft(req: Request, env: Env, body: DraftBody): Promise<Response> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const enc = new TextEncoder();
  const send = (event: string, data: unknown) =>
    w.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

  (async () => {
    try {
      await send("meta", { model: env.MODEL, sources: body.sources.length });
      const stream = client.beta.messages.stream({
        model: env.MODEL,                      // "claude-opus-5-5"
        max_tokens: 16000,
        output_config: { effort: "medium" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",                  // server-side refusal fallback
        system: DRAFT_SYSTEM,
        messages: [{ role: "user", content: buildDraftUser(body) }],
      });
      req.signal.addEventListener("abort", () => stream.abort());
      for await (const ev of stream) {
        if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
          await send("delta", { t: ev.delta.text });
        }
      }
      const final = await stream.finalMessage();
      const fallback = (final.usage.iterations ?? []).some((i: any) => i.type === "fallback_message");
      await send("done", { stop: final.stop_reason, fallback, outputTokens: final.usage.output_tokens });
    } catch (err) {
      await send("error", mapError(err));    // never include request text
    } finally {
      await w.close();
    }
  })();

  return new Response(readable, { headers: { ...sseHeaders, ...cors(req, env) } });
}
```

Notes:

- On `claude-opus-5-5`, thinking is always adaptive and can't be disabled. Don't send `thinking: {type:"disabled"}` or `budget_tokens` (400). Thinking blocks stream with empty text by default, so the first `delta` may lag by a few seconds. That's why the UI shows "Reading your sources…" after `meta`.
- **Always check `stop_reason === "refusal"`.** With `fallbacks: "default"` the API retries on a fallback model inside the same call. If it still refuses, the UI shows the "model declined" state.
- Before writing any code, confirm the exact SDK typings for `fallbacks` / `betas` against the installed `@anthropic-ai/sdk` version. If a typing is missing, use a typed cast rather than dropping the feature.

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

Implementation: the non-streaming `client.beta.messages.create(...)` with `max_tokens: 4000`, `output_config: { effort: "low" }` and the same fallback beta. Read text blocks only. For `titles`, split the output into lines, strip numbering and quotes, and take 3.

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

| Route | Model | Effort | max_tokens | Stream |
|---|---|---|---|---|
| draft | `claude-opus-5-5` | `medium` | 16,000 | yes |
| edit (all actions) | `claude-opus-5-5` | `low` | 4,000 | no |

- Pricing (Oct 2026): $4 / MTok in, $20 / MTok out. A typical Medium draft (~10k in + ~2k out incl. thinking) costs ≈ $0.08. 10 drafts per IP per hour caps abuse at about $0.80 per IP per hour. Also set a **monthly spend limit** in the Anthropic Console.
- The prompts are static strings, which keeps the system prompt cacheable. Prompt caching is optional for the MVP (the system prompt is below the minimum cacheable size on its own).
- The model id lives in the `MODEL` var, so it can be changed without a code edit.

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
