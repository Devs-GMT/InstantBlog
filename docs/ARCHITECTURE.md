# InstantBlog — Architecture

Covers the system overview, repo layout, front-end modules, data model, fingerprint algorithm, config constants and the main sequence flows.

---

## 1. System overview

```
   ┌──────────────── Vercel — one Next.js app (Root Directory: web/) ─────────────────┐
   │ Browser pages: /  /write/  /verify/  /posts/  /about/ /guides/ /privacy/ /terms/  │
   │   Tiptap editor · brief · exports (Clipboard / html2pdf / docx) · SHA-256         │
   │   localStorage drafts · ethers v6 (BrowserProvider + JsonRpcProvider)             │
   │                                                                                  │
   │ API route handlers (Node runtime, same origin):                                  │
   │   POST /api/extract-url  → safeFetch (IP-checked) + Readability                  │
   │   POST /api/blog/draft   → Gemini (SSE stream)                                   │
   │   POST /api/blog/edit    → Gemini (JSON)                                         │
   │   env: GEMINI_API_KEY · rate limits: Upstash Redis or in-memory                  │
   └───────────┬──────────────────────────────────────────┬──────────────┬──────────┘
               ▼                                          ▼ MetaMask     ▼ JSON-RPC
     Google Gemini API (gemini-3.6-flash, free tier)    BOT Chain mainnet 677 / testnet 968
                                                        InstantBlog.sol · scan.botchain.ai
```

**Trust boundaries**

- The **browser** holds the article text. It only leaves the browser for the app's own `/api` routes (drafting and edits), which don't log it.
- The **server side** (`web/server/`) holds the Gemini key and enforces the same-origin check, rate limits, input caps and the SSRF guard.
- The **chain** holds only `bytes32` hash, title, words, tone, sources count, author and timestamp.

---

## 2. Repository layout

```
InstantBlog/
├─ README.md · CLAUDE.md · .gitignore
├─ contracts/                           # Foundry: src/InstantBlog.sol · test/ · script/Deploy.s.sol (CONTRACT_SPEC.md)
├─ docs/                                # this documentation set
├─ tests/fingerprint.test.mjs           # locks fingerprint v1 (runs against web/lib/fingerprint.ts)
└─ web/                                 # Next.js 16 App Router on Vercel (pages + API)
   ├─ next.config.ts · package.json · tsconfig.json
   ├─ .env.example                      # server env template (copy to .env.local, gitignored)
   ├─ vercel.json                        # framework nextjs, pnpm install --frozen-lockfile, pnpm build
   ├─ public/  favicon.svg · logo-mark.svg · botchain-logo.svg
   ├─ app/
   │  ├─ api/  extract-url/ · blog/draft/ · blog/edit/ · health/   # route.ts handlers
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
   ├─ server/                           # server-only API logic
   │  ├─ env.ts · http.ts (errors, same-origin, IP) · ratelimit.ts (Upstash or memory)
   │  ├─ ssrf.ts · safeFetch.ts (undici, IP check at connect) · extract.ts (Readability)
   │  ├─ gemini.ts · draft.ts (SSE) · edit.ts · prompts.ts · limits.ts · mock.ts
   └─ lib/                              # client-side, framework-free logic
      ├─ config.ts      ALL client constants (contract, chain, API base) — NEXT_PUBLIC_* overrides
      ├─ fingerprint.ts canonicalText() + sha256 + wordCount() — FROZEN v1
      ├─ chain.ts       ABI, reads (public RPC), stamp(), error mapping
      ├─ api.ts         API client for /api/* (SSE parser over fetch)
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
| Framework | next **16.4.3**, react / react-dom **19.3.1** | Vercel (pages + API routes), Turbopack build |
| Wallet / contract | ethers **6.17.0** | `BrowserProvider` for writes, `JsonRpcProvider` (static network) for reads |
| Editor | @tiptap/react · starter-kit · extensions · pm **3.32.0** | StarterKit includes Link; Placeholder from `@tiptap/extensions` |
| Markdown → HTML | marked **15.0.4** (exact) | **Frozen with the fingerprint** — a parser change would change hashes |
| HTML → Markdown | turndown **7.2.4** | Custom light `escape` keeps `[1]` citations readable; custom list rule |
| Sanitise | dompurify **3.4.17** | All model HTML is sanitised before it reaches the DOM |
| PDF | html2pdf.js **0.14.0** | `import()` on first click; fallback `window.print()` + print.css |
| Word | docx **9.14.0** | `import()` on first click; fallback `.md` download |
| Icons | lucide-react **1.61.0** | ISC licence; notebook/writing icons |
| Server: extraction | @mozilla/readability **0.6.0** + linkedom **0.18.14** | Main-text extraction in `/api/extract-url` |
| Server: safe fetch | undici **8.12.3** | `Agent` with a `connect.lookup` that rejects private/internal IPs |
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
| `NEXT_PUBLIC_API_BASE` | empty (same origin) | Only to point a build at another deployment's API |
| `NEXT_PUBLIC_SITE_URL` | Vercel production domain (`NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`), else `https://instantblog.vercel.app` | Used for proof links |

**Testnet fallback:** while `NEXT_PUBLIC_CONTRACT_MAINNET` is unset, the app runs on the live testnet contract `0x4625aF5b93bB0C53Af096E34005b9E32Cb61F72a` (chain 968): footer, stamping, verify and /posts all use it. Setting the mainnet address switches everything to chain 677 at the next build.

Chain params for `wallet_addEthereumChain`: mainnet `0x2a5` (677), RPC `https://rpc.botchain.ai`, explorer `https://scan.botchain.ai`; testnet `0x3c8` (968), `https://rpc.bohr.life`, `https://scan.bohr.life`. Currency `BOT` / 18 decimals (unconfirmed — verify before launch).

---

## 7. Routing (static hosting)

- `next.config.ts`: `trailingSlash: true` (internal links and API paths end with `/`), `serverExternalPackages` for linkedom/Readability/undici. Pages are prerendered (○); `/api/*` routes are dynamic (ƒ).
- Query strings: `/verify/?proof=12` (proof card), `/write/?new=1` (fresh draft), `/write/?id=<draftId>` (open a draft).
- One deployment: pages and API ship together on Vercel.

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

- Gemini key only in server env (`web/.env.local`, Vercel env vars), never `NEXT_PUBLIC_*`, never in the repo; `web/server/*` is never imported by client components.
- Same origin: the API rejects requests whose `Origin` doesn't match the host; no CORS headers are sent.
- The API never logs request bodies. Logs carry route, status and timing only.
- All model HTML goes through DOMPurify before it reaches the DOM. Links get `rel="noopener noreferrer"` and `target="_blank"`.
- SSRF guard: [API § 3](API.md#3-post-apiextract-url) — URL check plus resolved-IP check at connect time (required on Vercel, where the cloud metadata IP could be reachable). `MOCK_AI` is dev-only.
- On-chain the title is public forever; the stamp confirm dialog says so.
