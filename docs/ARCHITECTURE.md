# InstantBlog — Architecture

Covers the system overview, repo layout, front-end modules, data model, fingerprint algorithm, config constants and the main sequence flows.

---

## 1. System overview

```
                         ┌──────────────────────────── Browser (GitHub Pages, static) ───────────────────────────┐
                         │  index.html  ── router ──▶  Home  │  /write  │  /verify  │  /posts                     │
                         │                                                                                     │
                         │  editor (Tiptap) · brief · exports (Clipboard / html2pdf / docx) · SHA-256 (WebCrypto)│
                         │  localStorage drafts · ethers v6 (BrowserProvider + JsonRpcProvider)                 │
                         └───────┬───────────────────────────────┬───────────────────────────────┬─────────────┘
                                 │ HTTPS (CORS locked)           │ MetaMask (writes)             │ JSON-RPC (reads)
                                 ▼                               ▼                               ▼
              ┌────────────── Cloudflare Worker ─────────┐   ┌─────────────────────────────────────────────┐
              │ POST /extract-url  → fetch + Readability │   │ BOT Chain mainnet (677)  rpc.botchain.ai     │
              │ POST /blog/draft   → Claude (SSE stream) │   │   InstantBlog.sol  stamp / getProof / ...    │
              │ POST /blog/edit    → Claude (JSON)       │   │ Explorer: scan.botchain.ai                   │
              │ KV: rate limits · Secret: ANTHROPIC_KEY  │   └─────────────────────────────────────────────┘
              └───────────────┬──────────────────────────┘
                              ▼
                    Anthropic Messages API (claude-opus-5-5)
```

**Trust boundaries**

- The **browser** holds the article text. It only leaves the browser for the Worker (drafting and edits), and the Worker doesn't log it.
- The **Worker** holds the API key and enforces CORS, rate limits, input caps and the SSRF guard.
- The **chain** holds only `bytes32` hash, title, words, tone, sources count, author and timestamp.

---

## 2. Repository layout

```
instantblog/
├─ README.md                      # plain-English README (contract address, how it works, honesty note)
├─ LICENSE                        # MIT
├─ contracts/
│  └─ InstantBlog.sol             # see CONTRACT_SPEC.md
├─ web/                           # → published to GitHub Pages (gh-pages branch or /docs folder)
│  ├─ index.html                  # single page app shell: home + write + verify + posts views
│  ├─ CNAME                       # custom domain
│  ├─ assets/
│  │  ├─ logo.svg  botchain-logo.svg  favicon.svg  og.png
│  │  └─ shots/ brief.webp editor.webp export.webp proof.webp sample-*.webp
│  ├─ css/
│  │  ├─ tokens.css               # design tokens (DESIGN_SYSTEM.md §2)
│  │  ├─ app.css                  # components + layouts
│  │  └─ print.css                # @media print A4 article layout
│  └─ js/
│     ├─ config.js                # ALL constants (contract address, chain, worker URL)
│     ├─ main.js                  # boot, router, nav
│     ├─ router.js                # path → view, ?proof param
│     ├─ store.js                 # localStorage drafts (try/catch, memory fallback)
│     ├─ wallet.js                # connect, switch/add chain, events
│     ├─ chain.js                 # contract reads/writes, ABI, error mapping
│     ├─ fingerprint.js           # canonicalText() + sha256 + wordCount()
│     ├─ api.js                   # Worker client: extractUrl, streamDraft (SSE), edit
│     ├─ brief.js                 # brief form, key points DnD, source chips
│     ├─ editor.js                # Tiptap setup, toolbar, citations, streaming insert
│     ├─ ai-edit.js               # bubble menu actions, preview Accept/Discard
│     ├─ export.js                # copy rich/md/plain, pdf, docx (+ fallbacks)
│     ├─ stamp.js                 # stamp flow, proof card, edited-since-stamp
│     ├─ verify.js                # /verify paste + ?proof card
│     ├─ posts.js                 # /posts list
│     └─ home.js                  # home interactions (FAQ accordion, footer counter)
├─ worker/
│  ├─ wrangler.toml
│  ├─ package.json                # @anthropic-ai/sdk, @mozilla/readability, linkedom
│  └─ src/
│     ├─ index.ts                 # router, CORS, errors
│     ├─ extract.ts               # /extract-url + SSRF guard
│     ├─ draft.ts                 # /blog/draft (SSE)
│     ├─ edit.ts                  # /blog/edit
│     ├─ prompts.ts               # system prompts (AI_PROMPTS.md)
│     ├─ ratelimit.ts             # KV hourly counters
│     └─ limits.ts                # input caps, token estimate
├─ scripts/
│  └─ build-pages.sh              # copies index.html → write/ verify/ posts/ 404.html
└─ docs/                          # this documentation set
```

> If you would rather keep the brief's literal "single index.html", inline `css/` and `js/` with `<style>` and `<script type="module">`. The module boundaries above still apply as sections of one file.

---

## 3. Front-end libraries (CDN, pinned)

| Purpose | Library | Load |
|---|---|---|
| Wallet / contract | ethers **6.13.4** | `https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.umd.min.js` |
| Editor | Tiptap **2.10.3** (`@tiptap/core`, `starter-kit`, `extension-link`, `extension-placeholder`, `extension-bubble-menu`) | `import … from "https://esm.sh/@tiptap/core@2.10.3"` (pin every package to the same version) |
| Markdown → HTML | marked **15.0.4** | `https://cdn.jsdelivr.net/npm/marked@15.0.4/marked.min.js` |
| HTML → Markdown | turndown **7.2.0** | `https://cdn.jsdelivr.net/npm/turndown@7.2.0/dist/turndown.js` |
| Sanitise | DOMPurify **3.2.3** | `https://cdn.jsdelivr.net/npm/dompurify@3.2.3/dist/purify.min.js` |
| PDF | html2pdf.js **0.10.2** | `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js` |
| Word | docx **9.1.0** | `import * as docx from "https://esm.sh/docx@9.1.0"` (lazy, on first click) |
| Fonts | Nunito 600/700, Inter 400/500/600, Newsreader 400/600, JetBrains Mono 500 | Google Fonts |

- **Lazy-load** html2pdf and docx on the first export click (`import()` / script injection). If loading fails, use the fallback in PRD § 10.
- Smoke-test every URL once at build start (task 0.0 in BUILD_PLAN). If a pinned path 404s, pick the nearest published patch version and update this table.

---

## 4. Data model

### 4.1 Draft (localStorage)

```ts
// key: "ib.drafts.v1" → Draft[] (max 30, newest first) · key: "ib.current" → draft id
type Draft = {
  id: string;                    // crypto.randomUUID()
  createdAt: number; updatedAt: number;
  brief: {
    topic: string;
    type: "blog" | "article" | "howto" | "listicle" | "opinion";
    tone: 0|1|2|3|4|5;           // same enum as the contract
    length: "short" | "medium" | "long";
    points: string[];            // 3–5
    sources: { url: string; status: "idle"|"reading"|"ok"|"error";
               title?: string; text?: string; pasted?: string; error?: string }[];
    audience?: string;
  };
  title: string;
  altTitles: string[];           // 3 chips
  markdown: string;              // source of truth for exports + hashing
  stamps: { proofId: number; hash: string; txHash: string; at: number; words: number }[];
};
// key: "ib.prefs.v1" → { aiLabel: boolean, serif: boolean, authorName?: string }
```

Source `text` is **not** persisted if it's larger than 20 KB per source, to save quota. It is re-read on demand.

### 4.2 On-chain Proof

See [CONTRACT_SPEC](CONTRACT_SPEC.md). `tone` uses the same 0–5 enum. `sources` = the number of sources actually used in the draft (status ok or pasted).

---

## 5. Fingerprint canonicalisation

Goal: the same article gives the same hash whether the user pastes the **Markdown**, a **plain-text** copy, or text copied back out of Google Docs or Medium.

```js
// fingerprint.js — v1. DO NOT change after mainnet launch without bumping FP_VERSION
export const FP_VERSION = 1;
const AI_LINE = /^written with ai assistance\.?$/i;
const MARKER  = /^(?:[-*+•·▪◦]|\d+[.)]|#{1,6}|>)\s+/;

export function canonicalText(input) {
  let md = input.normalize("NFC").replace(/\r\n?/g, "\n").replace(/<!--[\s\S]*?-->/g, "");
  const html = DOMPurify.sanitize(marked.parse(md, { gfm: true, breaks: false }));
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  // put a line break after every block so text from different blocks never merges
  doc.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,tr,br,hr")
     .forEach(el => el.after(doc.createTextNode("\n")));
  return doc.body.textContent
    .replace(/[​-‍﻿]/g, "")        // zero-width
    .replace(/ /g, " ")                      // nbsp
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .split("\n")
    .map(l => l.trim().replace(MARKER, "").trim())
    .filter(l => l && !AI_LINE.test(l))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fingerprint(markdown) {
  const bytes = new TextEncoder().encode(canonicalText(markdown));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return "0x" + [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Words shown in the UI and stored on-chain: body only (everything before "Sources"), no [n] markers
export function wordCount(markdown) {
  const body = markdown.split(/^##\s+Sources\s*$/mi)[0];
  return canonicalText(body).replace(/\[\d+\]/g, "").split(" ")
    .filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}
```

**Properties and limits (document these in the FAQ):**

- Insensitive to: Markdown vs plain text, list bullets, heading `#`, line wrapping, extra spaces, smart vs straight quotes, the AI-assistance footer line.
- Sensitive to: any change in words, punctuation, citation markers or capitalisation. This is intended, because one changed character changes the fingerprint.
- Known edge case: Markdown escapes in plain text (e.g. a literal `*star*` in plain text would be parsed as emphasis). Both sides go through the same pipeline, so it still matches.
- **Test vectors** live in [TEST_PLAN § 4](TEST_PLAN.md#4-fingerprint-test-vectors). Lock them before mainnet.

---

## 6. Config constants

```js
// web/js/config.js — the ONLY place these values live
export const CONFIG = {
  SITE_URL: "https://instantblog.xyz",                 // TODO custom domain
  WORKER_URL: "https://instantblog-api.<acct>.workers.dev",
  CONTRACT_ADDRESS: "0x0000000000000000000000000000000000000000", // TODO mainnet address
  DEPLOY_BLOCK: 0,                                     // TODO for event queries
  CHAIN: {
    chainId: "0x2a5",                                  // 677
    chainName: "BOT Chain",
    nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 }, // verify symbol
    rpcUrls: ["https://rpc.botchain.ai"],
    blockExplorerUrls: ["https://scan.botchain.ai"],
  },
  TESTNET: {
    chainId: "0x3c8",                                  // 968
    chainName: "BOT Chain Testnet",
    nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
    rpcUrls: ["https://rpc.bohr.life"],
    blockExplorerUrls: ["https://scan.bohr.life"],
  },
  USE_TESTNET: false,                                  // flip for local testing
  BOTCHAIN_URL: "https://botchain.ai",
  explorerAddress: a => `https://scan.botchain.ai/address/${a}`,
  explorerTx: h => `https://scan.botchain.ai/tx/${h}`,
  READING_WPM: 238,
  LIMITS: { points: [3, 5], sources: 5, titleBytes: 160, pasteWords: 3000 },
};
```

---

## 7. Routing (static hosting)

- `router.js` reads `location.pathname` (minus the base path) → `home | write | verify | posts`. It uses `history.pushState` for internal links and handles `popstate`.
- `scripts/build-pages.sh` copies `index.html` to `write/index.html`, `verify/index.html`, `posts/index.html` and `404.html`, so deep links return 200. Assets use **absolute** paths (`/css/app.css`).
- Query: `/verify?proof=12` → proof card mode.

---

## 8. Key sequences

### 8.1 Generate draft

```
User        brief.js        api.js                 Worker                     Claude
 │ click Generate │             │                      │                          │
 │───────────────▶│ validate    │                      │                          │
 │                │ snapshot editor (undo point)       │                          │
 │                │────────────▶│ POST /blog/draft     │                          │
 │                │             │─────────────────────▶│ ratelimit · caps · CORS  │
 │                │             │                      │── messages.stream ──────▶│
 │                │             │◀── SSE data:{t} ─────│◀── text_delta ───────────│
 │  caret + text  │◀─ onDelta ──│ (buffer → parse md   │                          │
 │                │             │  → editor.setContent │                          │
 │                │             │  every 120 ms)       │                          │
 │                │             │◀── event: done ──────│ stop_reason, usage       │
 │                │ parse <!-- titles --> → chips; save draft                     │
```

Streaming insert strategy: keep `buffer += delta`, and every 120 ms (rAF-throttled) call `editor.commands.setContent(marked.parse(buffer))` with a caret decoration at the end. On `done`, do the final setContent and add **one** history entry. This is simpler and more robust than incremental node insertion.

### 8.2 AI edit

```
select text → BubbleMenu(action) → ai-edit.js builds {action, selection, paragraph, brief, tone?}
→ POST /blog/edit → {text} → render preview card (decoration widget under selection)
→ Accept: editor.chain().focus().insertContentAt({from,to}, html).run()  (single transaction)
→ Discard: remove widget
```

### 8.3 Stamp

```
click Stamp → wallet connected? (else connect) → chainId 677? (else switch/add)
→ hash = fingerprint(markdown); words = wordCount(markdown)
→ proofsForHash(hash) non-empty? → confirm "already stamped as #n"
→ contract.stamp(hash, title(≤160B), words, tone, sources)  → tx pending UI
→ receipt → parse Stamped event → id → save to draft.stamps → proof card
```

### 8.4 Verify

```
paste → fingerprint → JsonRpcProvider.proofsForHash(hash) → ids[] → getProof(min id) → result card
?proof=N → getProof(N) (revert → "Proof not found")
```

---

## 9. Security and privacy checklist

- API key only in Worker secrets (`wrangler secret put ANTHROPIC_API_KEY`). Never in the repo or the front end.
- CORS: `Access-Control-Allow-Origin` = exact `SITE_URL` (+ `http://localhost:5173` only when `ENV=dev`).
- The Worker never logs request bodies. Errors log only the route, status and an error code.
- All model HTML goes through DOMPurify before it reaches the DOM. Links get `rel="noopener noreferrer"` and `target="_blank"`.
- The SSRF guard is in [WORKER_API § 3](WORKER_API.md#3-post-extract-url).
- On-chain: the title is public forever. Warn in the stamp confirm dialog: "Your title, word count and wallet address will be public on BOT Chain. The article text stays private."
