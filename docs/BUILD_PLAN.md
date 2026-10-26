# InstantBlog — Build Plan (~5 hours)

A time-boxed plan, with each task tied to its PRD requirement IDs. Every phase ends with a **checkpoint** that must pass before moving on. If a phase overruns by more than 15 min, apply its **cut line**.

**Critical path:** Contract (testnet) → API draft stream → Writer streaming into the editor → Stamp + Verify → Mainnet → Live site. The home page polish and the extra AI actions are what you cut first.

---

## Phase 0 · Setup (pre-flight, 10 min, before the clock starts if possible)

| # | Task | Done when |
|---|---|---|
| 0.0 | Create the repo and the folders from [ARCHITECTURE § 2](ARCHITECTURE.md#2-repository-layout). Smoke-test the CDN URLs in [ARCHITECTURE § 3](ARCHITECTURE.md#3-front-end-libraries-cdn-pinned) | All libs load in a blank page with no console errors |
| 0.1 | MetaMask: add BOT Chain testnet (968) and mainnet (677). Get testnet BOT from the faucet and a little mainnet BOT | Balances on both |
| 0.2 | Free Gemini key from Google AI Studio into `web/.env.local` | `/api/health/` → `ai: gemini` |
| 0.3 | Create the Vercel project from the GitHub repo (Root Directory `web`) | Preview URL builds |

---

## Phase 1 · Contract (0:00–0:30)

| # | Task | Req | Done when |
|---|---|---|---|
| 1.1 | Paste `InstantBlog.sol` from [CONTRACT_SPEC § 5](CONTRACT_SPEC.md#5-reference-implementation) into Remix. Compiler 0.8.24, EVM `paris`, optimizer 200 | — | Compiles with no warnings |
| 1.2 | Deploy to **testnet 968**, run the [manual checklist § 8](CONTRACT_SPEC.md#8-manual-test-checklist-testnet-968) | — | All 7 checks pass. Address noted in `config.js` → `TESTNET_CONTRACT` |
| 1.3 | Save the ABI into `web/js/chain.js` (human-readable from the spec) | — | — |

**Checkpoint 1:** `total()` returns 2 on scan.bohr.life after the test stamps.

---

## Phase 2 · API routes (0:30–1:15)

| # | Task | Req | Done when |
|---|---|---|---|
| 2.1 | `web/server/http.ts`: same-origin check, JSON error envelope, body size cap; `/api/health` | API § 1 | `/api/health/` → `{ok:true}`. A foreign Origin gets 403 |
| 2.2a | `/extract-url` with the SSRF guard + Readability (or reuse Inkprint's after checking that its guard covers [API § 3](API.md)) | B-6, § 6.1 | Wikipedia URL → title + text. All the SSRF test URLs → 422 `blocked_address` |
| 2.3 | `prompts.ts` from [AI_PROMPTS](AI_PROMPTS.md) | D-3 | — |
| 2.4 | `/blog/draft`: validation, source budget, SSE `meta/delta/done/error`, abort pass-through | D-1 | `curl -N` with the fixture streams Markdown with an H1, a titles comment, H2s and Sources |
| 2.5 | `/blog/edit`: all 10 actions, `missingCitations` | E-3, E-6 | Shorten fixture returns shorter text that keeps `[1]` |
| 2.6 | `ratelimit.ts` (Upstash Redis or in-memory) on all three routes | API § 1 | The 11th draft in an hour → 429 + `Retry-After` |
| 2.7 | Deploy to Vercel (preview) | — | Preview URL streams a draft |

**Checkpoint 2:** a streamed draft arrives in the terminal in under 45 s.
**Cut line:** if the draft is late, ship `/blog/edit` with only rewrite / shorten / expand / tone, and add the rest later.

---

## Phase 3 · Writer `/write` (1:15–3:00) — the core

| # | Time | Task | Req | Done when |
|---|---|---|---|---|
| 3.1 | 15m | App shell: `index.html`, tokens.css, router (`/`, `/write`, `/verify`, `/posts`), top bar, 2-column layout, mobile tabs | § 7 | Views switch with no reload. Mobile tabs work at 375 px |
| 3.2 | 20m | Brief form: topic, type seg, tone chips, length seg, key points (add/remove/drag + ↑↓), audience, validation + hints | B-1…B-8 | Generate is enabled only when valid. The hint text is correct |
| 3.3 | 15m | Sources: URL inputs → `/extract-url` → status chips → paste fallback | B-6 | ✓ / ✗ chips. Pasted text counts as a source |
| 3.4 | 15m | Tiptap editor: StarterKit + Link + Placeholder, formatting toolbar, serif toggle, word count + reading time | E-8, X-7 | Typing and formatting work. Counters update |
| 3.5 | 20m | Streaming: `api.streamDraft` → buffer → throttled `setContent(marked→DOMPurify)`, caret, status line, Stop, error banner + Retry, snapshot/undo | D-1…D-7 | Draft streams in. Stop keeps the partial text. A forced error shows Retry and keeps the content |
| 3.6 | 10m | Post-process: parse `<!-- titles -->` → chips (swap on click), citation pills + hover highlight, bad-citation check | D-3, D-4, D-8 | Hovering `[2]` highlights source 2 |
| 3.7 | 20m | AI edit: BubbleMenu actions + tone dropdown, preview card with Accept/Discard (one undo step), panel helpers (intro, conclusion, titles, section) | E-1…E-7 | Shorten → preview → Accept → Ctrl+Z restores |
| 3.8 | 10m | Autosave drafts (`store.js`, try/catch), restore on load | M-1 | Reload restores the draft. Works in a private window |

**Checkpoint 3:** brief → streamed draft with citations → shorten one paragraph → accept, all on desktop and on a phone-sized viewport.
**Cut lines (in this order):** drag reorder → ↑↓ only · panel helpers → keep Suggest titles only · serif toggle.

---

## Phase 4 · Exports (3:00–3:30)

| # | Task | Req | Done when |
|---|---|---|---|
| 4.1 | Copy menu: rich text (ClipboardItem html+plain), Markdown (Turndown), plain text, AI-label toggle, fallbacks | X-1…X-3, X-6 | Pasting into Google Docs keeps the headings and links |
| 4.2 | PDF: hidden A4 print layout (`print.css`) + html2pdf lazy load, fallback `window.print()` | X-4 | The PDF has a title, byline, body, sources and the footer line, with no cut-off lines |
| 4.3 | .docx: lazy `docx` import, walk the editor JSON → Paragraph/HeadingLevel/TextRun/ExternalHyperlink/bullets; fallback `.md` | X-5 | Opens in Word / Google Docs with real headings and clickable links |

**Checkpoint 4:** all 5 exports work on the deployed preview (clipboard needs HTTPS).

---

## Phase 5 · Stamp + Verify (3:30–3:50)

| # | Task | Req | Done when |
|---|---|---|---|
| 5.1 | `wallet.js`: connect, short address, switch/add chain, events, Install MetaMask state | W-1…W-5 | Wrong network → switch prompt works |
| 5.2 | `fingerprint.js` + the [test vectors](TEST_PLAN.md#4-fingerprint-test-vectors) | P-1 | All vectors pass in the console |
| 5.3 | `stamp.js`: confirm dialog, duplicate warning, tx states, parse `Stamped` event, proof card, Copy proof link, Edited-since-stamp badge, version trail | P-2…P-7 | Stamp on testnet → proof card #n |
| 5.4 | `verify.js`: paste → match / no match. `?proof=` card. Unknown id | V-1…V-5 | A plain-text copy from Google Docs matches |
| 5.5 | `/posts`: drafts list + `proofsOf` | M-2, M-3 | Both lists render |

**Checkpoint 5:** stamp on testnet → open `/verify?proof=n` in a private window (no wallet) → card shows. Paste the plain-text copy → ✓ Matches.

---

## Phase 6 · Home page + footer + states (3:50–4:30)

| # | Task | Done when |
|---|---|---|
| 6.1 | Take screenshots of our own UI with demo content (brief, editor, export menu, proof card) → webp | 4–6 shots in `assets/shots/` |
| 6.2 | Sections 1–4 (hero with screenshot stack, audience cards, problem, how it works) | Matches [DESIGN_SYSTEM § 7](DESIGN_SYSTEM.md#7-home-page--section-specs) |
| 6.3 | Sections 5–8 (feature rows with example cards, proof section, FAQ accordion, dark CTA band) | All 8 sections are present |
| 6.4 | Receipt footer with live `total()`, copy address, explorer link, BOT Chain logo link, link groups, bottom line | All links work. The counter loads |
| 6.5 | State sweep: go through the [PRD § 10](PRD.md#10-states-to-handle) table | Every row checked |

**Cut lines:** parallax/tilt → static · example output cards → a single shared card · Guides links → anchors into the FAQ.

---

## Phase 7 · Mainnet + go live (4:30–4:45)

| # | Task | Done when |
|---|---|---|
| 7.1 | Deploy `InstantBlog.sol` to **mainnet 677** with the same settings. Verify the source on scan.botchain.ai | The contract page shows verified code |
| 7.2 | `config.js` → `CONTRACT_ADDRESS`, `DEPLOY_BLOCK`, `USE_TESTNET=false`. Update the README | One constant changed |
| 7.3 | Set Vercel env vars → push to `main` → production deploy | Live URL loads `/write/` directly (200) |
| 7.4 | Stamp **2–3 demo articles** on mainnet (how-to, listicle, opinion) | The footer counter shows ≥ 3 |

---

## Phase 8 · Ship (4:45–5:00)

| # | Task |
|---|---|
| 8.1 | README final pass ([template in repo root](../README.md)): address, live URL, how it works, honesty note, **no keys** (`git grep -nI "AIza"` returns nothing) |
| 8.2 | Record the demo clip following [SUBMISSION § 2](SUBMISSION.md#2-demo-script-60-90-s) |
| 8.3 | Post on X tagging @BOTChain_ai ([draft](SUBMISSION.md#3-x-post)) |
| 8.4 | Fill in the submission checklist |

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Tiptap ESM via esm.sh is slow or breaks | Med | Pin versions and test in phase 0. Fallback: Quill 2 (UMD on jsDelivr) with a custom selection toolbar |
| Many sites block server-side fetches (403 / bot challenges) | High | The paste-text fallback is first-class. Test the demo with Wikipedia, MDN and GitHub blog sources |
| `PUSH0` unsupported on BOT Chain | Low–Med | Compile with EVM `paris` |
| Clipboard rich-text blocked (Firefox / http) | Med | HTTPS only. `execCommand` fallback. Manual-copy modal |
| html2pdf breaks long pages / CORS images | Med | No external images in the article. `pagebreak: {mode: ['css','legacy']}`. Fall back to print |
| LLM latency > 45 s on Long | Med | Show live streaming progress. The Long cap is 1,400 words. Effort `medium` |
| Rate limit too strict during the demo | Low | Bump `LIMITS` vars for demo day |
| Fingerprint mismatch between stamp and verify | Med | Lock the test vectors before mainnet. Same `canonicalText` module everywhere |
