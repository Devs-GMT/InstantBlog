# InstantBlog — Architecture

Covers the system overview, repo layout, front-end modules, data model, fingerprint algorithm, config constants and the main sequence flows.

---

## 1. System overview

```
              ┌──────────────── Browser — Next.js static export on GitHub Pages ────────────────┐
              │  /  (home)   /write/   /verify/   /posts/   /about/ /guides/ /privacy/ /terms/   │
              │                                                                                 │
              │  Tiptap v3 editor · brief · exports (Clipboard / html2pdf / docx) · SHA-256      │
              │  localStorage drafts · ethers v6 (BrowserProvider + JsonRpcProvider)             │
              └───────┬───────────────────────────────┬───────────────────────────────┬─────────┘
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
InstantBlog/
├─ README.md · CLAUDE.md · .gitignore
├─ contracts/InstantBlog.sol            # see CONTRACT_SPEC.md
├─ docs/                                # this documentation set
├─ tests/fingerprint.test.mjs           # locks fingerprint v1 (runs against web/lib/fingerprint.ts)
├─ worker/                              # Cloudflare Worker (WORKER_API.md)
│  ├─ wrangler.toml · .dev.vars.example
│  └─ src/
│     ├─ index.ts      router, CORS, error envelope, logging (no bodies)
│     ├─ http.ts       Env type, CORS + JSON helpers
│     ├─ ssrf.ts       URL guard (every hop)
│     ├─ extract.ts    /extract-url (Readability + linkedom, 2 MB / 5 s caps)
│     ├─ draft.ts      /blog/draft (SSE: meta/delta/ping/done/error)
│     ├─ edit.ts       /blog/edit (10 actions, missingCitations)
│     ├─ claude.ts     Anthropic client, fallback beta, error mapping
│     ├─ prompts.ts    system prompts (AI_PROMPTS.md)
│     ├─ limits.ts     validation, source budget, token cap
│     ├─ ratelimit.ts  KV hourly counters
│     └─ mock.ts       dev-only canned AI (MOCK_AI=1)
└─ web/                                 # Next.js 16 App Router, output: "export"
   ├─ next.config.ts · package.json · tsconfig.json
   ├─ scripts/flatten-rsc.mjs           # post-export: RSC payload aliases for GitHub Pages
   ├─ public/  CNAME · .nojekyll · favicon.svg · logo-mark.svg · botchain-logo.svg
   ├─ app/
   │  ├─ layout.tsx                     # fonts (next/font), metadata, <Providers>
   │  ├─ page.tsx                       # home: 8 sections + footer
   │  ├─ write/  verify/  posts/        # app routes (client components inside)
   │  ├─ about/  guides/  privacy/  terms/  not-found.tsx
   │  └─ styles/ tokens.css · app.css · print.css
   ├─ components/
   │  ├─ Providers.tsx (toast + modal) · WalletProvider.tsx · WalletButton.tsx
   │  ├─ Nav.tsx · Footer.tsx (receipt + live total) · Receipt.tsx · ProofCard.tsx · Brand.tsx · Icons.tsx
   │  ├─ Verify.tsx · Posts.tsx · StaticPage.tsx
   │  ├─ home/  Sections.tsx · Mockups.tsx (product shots built from our own UI)
   │  └─ writer/
   │     ├─ WriterLoader.tsx            # dynamic(..., { ssr: false })
   │     ├─ Writer.tsx                  # orchestration: load/save, generate, tabs, top bar
   │     ├─ BriefPanel.tsx              # brief form, key points DnD, source chips
   │     ├─ Toolbar.tsx                 # formatting toolbar (useEditorState)
   │     ├─ useAiTools.tsx              # selection toolbar, preview card, panel helpers
   │     ├─ useStamp.tsx                # stamp flow + proof card state
   │     └─ Exports.tsx                 # Copy ⌄ / PDF / .docx + mobile Export tab
   └─ lib/                              # framework-free logic
      ├─ config.ts      ALL constants (contract, chain, Worker URL) — NEXT_PUBLIC_* overrides
      ├─ fingerprint.ts canonicalText() + sha256 + wordCount() — FROZEN v1
      ├─ chain.ts       ABI, reads (public RPC), stamp(), error mapping
      ├─ api.ts         Worker client (SSE parser over fetch)
      ├─ store.ts       localStorage drafts/prefs (try/catch + memory fallback)
      ├─ brief.ts       validation, usable sources, payload
      ├─ markdown.ts    marked/DOMPurify/Turndown round-trip, titles comment parser
      ├─ editorUtil.ts  citation decorations, doc structure, helper ranges
      ├─ exporters.ts   rich/md/plain copy, PDF, .docx (+ fallbacks)
      └─ format.ts      formatting + download helpers
```

---

## 3. Front-end libraries (npm, pinned in `web/package.json`)

| Purpose | Library | Notes |
|---|---|---|
| Framework | next **16.4.3**, react / react-dom **19.3.1** | Static export, Turbopack build |
| Wallet / contract | ethers **6.17.0** | `BrowserProvider` for writes, `JsonRpcProvider` (static network) for reads |
| Editor | @tiptap/react · starter-kit · extensions · pm **3.32.0** | StarterKit includes Link; Placeholder from `@tiptap/extensions` |
| Markdown → HTML | marked **15.0.4** (exact) | **Frozen with the fingerprint** — a parser change would change hashes |
| HTML → Markdown | turndown **7.2.4** | Custom light `escape` keeps `[1]` citations readable; custom list rule |
| Sanitise | dompurify **3.4.17** | All model HTML is sanitised before it reaches the DOM |
| PDF | html2pdf.js **0.14.0** | `import()` on first click; fallback `window.print()` + print.css |
| Word | docx **9.14.0** | `import()` on first click; fallback `.md` download |
| Fonts | Nunito, Inter, Newsreader, JetBrains Mono | `next/font/google` (self-hosted at build) |

---

## 4. Data model

### 4.1 Draft (localStorage) — `web/lib/store.ts`

```ts
// key "ib.drafts.v1" → Draft[] (max 30, newest first) · "ib.current" → draft id · "ib.prefs.v1" → Prefs
type Draft = {
  id: string; createdAt: number; updatedAt: number;
  brief: {
    topic: string; type: "blog" | "article" | "howto" | "listicle" | "opinion";
    tone: number;                         // 0–5, same enum as the contract
    length: "short" | "medium" | "long";
    points: string[];                     // 3–5
    sources: { url: string; status: "idle" | "reading" | "ok" | "error";
               title?: string; text?: string; words?: number; pasted?: string; error?: string; showPaste?: boolean }[];
    audience: string;
  };
  title: string; altTitles: string[];
  html: string;                           // editor HTML — Markdown/exports/hash are derived from it
  words: number;
  stamps: { proofId: number; hash: string; txHash: string; at: number; words: number }[];
};
type Prefs = { aiLabel: boolean; serif: boolean; authorName: string };
```

Source `text` over 20 KB isn't persisted (quota). Such sources are re-read when the writer loads.

### 4.2 On-chain Proof

See [CONTRACT_SPEC](CONTRACT_SPEC.md). `sources` = number of usable sources (read OK or pasted text).

---

## 5. Fingerprint canonicalisation — `web/lib/fingerprint.ts` (v1, frozen)

Goal: the same article gives the same hash whether the user pastes the **Markdown**, a **plain-text** copy, or text copied back out of Google Docs or Medium.

Algorithm:

1. Normalise to NFC, CRLF → LF, remove HTML comments (e.g. the titles comment).
2. Render with `marked` (GFM, no `breaks`) and parse with `DOMParser` (no scripts run, so no sanitising needed for text).
3. Insert a line break after every block element (`h1–h6, p, li, blockquote, pre, tr, br, hr`) and take `body.textContent`.
4. Remove zero-width characters (U+200B–U+200D, U+FEFF), turn NBSP into a space, smart quotes into straight quotes.
5. Per line: trim, strip one leading marker (`- * + • · ▪ ◦`, `1.` / `1)`, `#…`, `>`), drop empty lines and the line "Written with AI assistance".
6. Join with spaces, collapse whitespace, trim → SHA-256 → `0x…` bytes32.

`wordCount()` = words in the canonical text of everything before `## Sources`, without `[n]` markers.

**Properties:** insensitive to Markdown vs plain text, bullets, heading `#`, wrapping, extra spaces, smart quotes and the AI footer line. Sensitive to any change in words, punctuation, citations or capitalisation (intended).

**Locked by** `tests/fingerprint.test.mjs` (vectors in [TEST_PLAN § 4](TEST_PLAN.md#4-fingerprint-test-vectors)) and by the E2E check that the app's Markdown copy and plain-text copy produce the same hash.

---

## 6. Config — `web/lib/config.ts`

All constants live here. Build-time overrides (`NEXT_PUBLIC_*`, inlined by Next):

| Env var | Default (prod) | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CONTRACT_MAINNET` | zero address | Mainnet contract after deploy |
| `NEXT_PUBLIC_CONTRACT_TESTNET` | zero address | Testnet contract |
| `NEXT_PUBLIC_USE_TESTNET` | unset | `1` → chain 968 + testnet contract |
| `NEXT_PUBLIC_WORKER_URL` | `https://instantblog-api.YOUR-ACCOUNT.workers.dev` | Worker base URL (dev default `http://127.0.0.1:8787`) |
| `NEXT_PUBLIC_SITE_URL` | `https://instantblog.xyz` | Used for proof links |

While the contract address is the zero address, `contractConfigured()` is false: the footer shows "Deploying soon" and Stamp explains that stamping isn't live yet.

Chain params for `wallet_addEthereumChain`: mainnet `0x2a5` (677), RPC `https://rpc.botchain.ai`, explorer `https://scan.botchain.ai`; testnet `0x3c8` (968), `https://rpc.bohr.life`, `https://scan.bohr.life`. Currency `BOT` / 18 decimals (unconfirmed — verify before launch).

---

## 7. Routing (static hosting)

- `next.config.ts`: `output: "export"`, `trailingSlash: true`, `images.unoptimized` → every route is `<route>/index.html`, so deep links return 200 on GitHub Pages. Internal links use trailing slashes (`/write/`).
- `scripts/flatten-rsc.mjs` runs after `next build`: Next 16 writes RSC payloads as `<route>/__next.<seg>/__PAGE__.txt` while client navigation requests `<route>/__next.<seg>.__PAGE__.txt`; the script writes the dot-joined aliases so client-side navigation doesn't 404.
- Query strings: `/verify/?proof=12` (proof card), `/write/?new=1` (fresh draft), `/write/?id=<draftId>` (open a draft).
- No API routes, middleware, server actions or image optimisation — static export only.

---

## 8. Key sequences

### 8.1 Generate draft

```
click Generate → validate brief → (confirm replace) → snapshot editor HTML
→ POST /blog/draft (SSE) → buffer += delta; every 120 ms: setContent(marked(buffer)) WITHOUT history
→ done → restore snapshot (no history) → setContent(final) WITH history  ⇒ one Ctrl+Z restores the old draft
→ parse <!-- titles: … --> into chips · check citations · recount · save
```

### 8.2 AI edit

```
select ≥3 words → floating toolbar → POST /blog/edit {action, selection (Markdown), paragraph, brief, outline, sources?}
→ editor set read-only while the preview card is open (keeps positions valid)
→ Accept: insertContentAt({from,to}, html) in one transaction  (plain text inserted decoded — Tiptap inserts raw strings verbatim)
→ Discard / Esc: close card, editor editable again
```

### 8.3 Stamp

```
click Stamp → contract configured? → MetaMask? → connect → chain 677 (switch/add)
→ md = turndown(editor HTML); hash = fingerprint(md); words = wordCount(md); title cut to 160 bytes
→ proofsForHash(hash) non-empty? → confirm "already stamped as #n" → confirm public-data dialog
→ stamp() → pending (tx link) → receipt → parse Stamped → id → draft.stamps → proof card
```

### 8.4 Verify

```
paste → fingerprint → proofsForHash(hash) → ids[] → getProof(min id) → "✓ Matches proof #id"
?proof=N → getProof(N) (UnknownProof → "Proof not found")
```

---

## 9. Security and privacy checklist

- API key only in Worker secrets (`wrangler secret put ANTHROPIC_API_KEY`). Never in the repo or the front end.
- CORS: exact allow-list from `ALLOWED_ORIGINS` (production domain; `http://localhost:5173` only in `.dev.vars`).
- The Worker never logs request bodies. Logs carry route, status, error code and timing only.
- All model HTML goes through DOMPurify before it reaches the DOM. Links get `rel="noopener noreferrer"` and `target="_blank"`.
- SSRF guard: [WORKER_API § 3](WORKER_API.md#3-post-extract-url). `MOCK_AI` is dev-only.
- On-chain the title is public forever; the stamp confirm dialog says so.
