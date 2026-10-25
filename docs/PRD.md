# InstantBlog — Product Requirements Document (MVP)

| | |
|---|---|
| **Version** | 1.0 · 2026-10-25 |
| **Category** | AI · Productivity |
| **Feasibility** | 🟡 Medium |
| **Target build time** | ~5 hours (Build Week 2) |
| **Chain** | BOT Chain mainnet (chain ID 677) · testnet (chain ID 968) |
| **Related docs** | [BUILD_PLAN](BUILD_PLAN.md) · [ARCHITECTURE](ARCHITECTURE.md) · [CONTRACT_SPEC](CONTRACT_SPEC.md) · [WORKER_API](WORKER_API.md) · [AI_PROMPTS](AI_PROMPTS.md) · [DESIGN_SYSTEM](DESIGN_SYSTEM.md) · [CONTENT_COPY](CONTENT_COPY.md) · [TEST_PLAN](TEST_PLAN.md) · [DEPLOYMENT](DEPLOYMENT.md) · [SUBMISSION](SUBMISSION.md) |

---

## 1. Summary

**One-liner:** Write a sourced blog post or article in minutes. Pick a topic, a tone and 3–5 key points, and add your source links. The AI drafts the post with citations and helps you polish it. You can then copy it or download it as PDF or Word, and stamp proof that you wrote it on BOT Chain.

**Core loop:**

```
Brief  →  AI reads sources  →  Streamed draft with [n] citations  →  Edit with AI helpers
       →  Copy / PDF / .docx  →  Stamp SHA-256 fingerprint on BOT Chain  →  Anyone verifies a copy
```

### 1.1 Problem

| Pain | What happens today |
|---|---|
| **Slow** | It takes hours to get from a blank page to a first draft. |
| **Generic** | AI text sounds like everyone else's and ignores the writer's own points. |
| **Unsourced** | AI tools state facts and numbers with no links to check, and some of them are made up. |
| **No provenance** | Once a post is copied around, nobody can show who had that exact text first. |

### 1.2 Solution

- A **short brief** (topic, type, tone, length, 3–5 key points, 0–5 sources). Each key point becomes one section.
- **Grounded drafting:** the Worker reads each source URL. The model may use only those sources for facts, statistics and quotes, and must cite them as `[n]`.
- **AI editing on selected text**, previewed with Accept / Discard, so the user stays in control of their voice.
- **Exports that work in the browser:** rich-text copy for Docs, Notion or Medium, plus Markdown, plain text, PDF and .docx.
- **Proof of authorship:** a SHA-256 fingerprint of the article plus a few small numbers are stored on BOT Chain with a timestamp. The text itself never goes on-chain.

### 1.3 Goals and success metrics (demo-day)

| Goal | Metric / target |
|---|---|
| Fast first draft | Brief submitted → first streamed token in **< 4 s**; full Medium draft in **< 45 s** |
| Grounded output | 100% of statistics and quotes in demo drafts carry a `[n]` that maps to a real source |
| Usable exports | Copy, PDF and .docx all open cleanly in Google Docs, Word and a PDF viewer |
| On-chain proof | Stamp tx confirms on mainnet; `/verify` matches a pasted copy; `?proof=N` loads with no wallet |
| Works everywhere | Writer is usable at 375 px wide and on desktop; Lighthouse accessibility ≥ 90 on home |

### 1.4 Non-goals

See [§ 12 Out of scope](#12-out-of-scope-mvp).

---

## 2. Users and use cases

| Persona | Typical job-to-be-done | Typical type / tone |
|---|---|---|
| **Students** | Essays and research summaries from assigned readings | Article · Academic |
| **Creators** | Newsletters and blog posts | Blog post · Friendly / Witty |
| **Founders** | Launch posts and investor or community updates | Article · Inspiring / Professional |
| **Marketers** | SEO-friendly articles from product pages and reports | Listicle / How-to · Professional |
| **Developers / DevRel** | Tutorials and changelogs from docs and PRs | How-to guide · Casual / Professional |
| **Hackathon teams** | Project write-ups for submissions | Blog post · Inspiring |

**Primary demo story:** A hackathon team pastes 3 source links and 3 key points, gets a sourced post, shortens the intro, downloads Word, stamps it on BOT Chain and shares the proof link.

---

## 3. Definition of done (must-haves)

- [ ] **MetaMask wallet connect.** Connect button and short address (`0xAB…9f3c`). Auto-switch to BOT Chain mainnet (chain ID 677), or add it if MetaMask doesn't have it.
- [ ] **Core feature works end-to-end.** Fill the brief → AI draft with citations appears in the editor → **[Stamp on BOT Chain]** tx succeeds → proof loads by link and verifies the same article.
- [ ] **AI editing helpers** work on selected text (§ 5.4).
- [ ] **Exports:** Copy (rich text, Markdown, plain text), Download PDF, Download .docx.
- [ ] **Home page with 8 sections** (§ 8).
- [ ] **Mainnet deployment.** Contract is on BOT Chain mainnet, its address is in the README and the footer, and it shows on scan.botchain.ai.
- [ ] **Live website.** Public URL (GitHub Pages + custom domain) and a live Worker. Works on mobile and desktop.
- [ ] **BOT Chain footer.** Clickable BOT Chain logo → botchain.ai, and **View on explorer** → the mainnet contract (§ 11).

---

## 4. User flow

```
Home ──[Write my first post]──▶ /write
  │                               ├─ 1. Brief panel (left)
  │                               ├─ 2. Generate → streamed draft (centre editor)
  │                               ├─ 3. Edit with AI (selection toolbar + panel actions)
  │                               ├─ 4. Export (top bar)
  │                               └─ 5. Stamp on BOT Chain → proof card → [Copy proof link]
  └──[Verify an article]─────────▶ /verify  (paste text)   or   /verify?proof=12 (proof card)
My posts ──▶ /posts   (local drafts + on-chain proofs of the connected wallet)
```

| Step | Screen | What happens |
|---|---|---|
| 1 · Start | Home / navbar | **[Write my first post]** opens `/write`. The last draft is restored if there is one. |
| 2 · Brief | `/write` left panel | Topic, Type, Voice tone, Length, Key points (3–5, drag to reorder), Sources (0–5 URLs with status chips), Audience (optional) → **[Generate draft →]** |
| 3 · Draft | `/write` editor | The draft streams in: title + 3 alternative title chips, intro, one H2 per key point, conclusion and a **Sources** list. Facts from sources carry `[1][2]`. |
| 4 · Edit | `/write` editor | Select text → floating toolbar (Rewrite · Shorten · Expand · Change tone ⌄ · Simplify · Fix grammar). Panel: Write intro · Write conclusion · Suggest titles · Add a section for…. Each AI change shows a preview with **[Accept] / [Discard]**. |
| 5 · Export | `/write` top bar | **[Copy ⌄]** (Rich text · Markdown · Plain text) · **[PDF]** · **[.docx]**. Word count and reading time are always visible. |
| 6 · Stamp | `/write` top bar | **[Stamp on BOT Chain]** → MetaMask → proof card "Stamped #12 · Oct 23, 2026 · 1,024 words" + **[Copy proof link]** + **[View on explorer ↗]**. Later versions can be re-stamped to build a version trail. |
| 7 · Verify | `/verify` | Paste any copy → "✓ Matches proof #12 by 0xAB…, stamped Oct 23, 2026" or "No proof for this exact text". `?proof=12` opens a proof card with no wallet needed. |
| — · My posts | `/posts` | Drafts saved in this browser plus stamped proofs of the connected wallet, read from the contract. |

---

## 5. Functional requirements

IDs are referenced from [BUILD_PLAN](BUILD_PLAN.md) and [TEST_PLAN](TEST_PLAN.md).

### 5.1 Wallet (W)

| ID | Requirement |
|---|---|
| W-1 | The **Connect wallet** pill in the navbar calls `eth_requestAccounts`. Once connected, the pill shows the short address `0xAB…9f3c` and a menu with Copy address, View on explorer and Disconnect (disconnect is local only). |
| W-2 | On connect, and before every stamp, check `eth_chainId`. If it isn't `0x2a5` (677), call `wallet_switchEthereumChain`. On error `4902`, call `wallet_addEthereumChain` with the mainnet params from [ARCHITECTURE § 6](ARCHITECTURE.md#6-config-constants). |
| W-3 | Listen to `accountsChanged` and `chainChanged` and update the UI without a reload. |
| W-4 | No MetaMask: the pill says **Install MetaMask** and links to metamask.io in a new tab. Writing, AI and exports still work. |
| W-5 | Read-only calls (verify, proof card, stamp counter, My posts proofs) use a `JsonRpcProvider` on `https://rpc.botchain.ai` and never need a wallet. |

### 5.2 Brief (B)

| ID | Field | Rules |
|---|---|---|
| B-1 | **Topic** "What's it about?" | Required, 5–160 chars. Placeholder: "Why small dApps win hackathons". |
| B-2 | **Type** | Segmented control: Blog post · Article · How-to guide · Listicle · Opinion. Default Blog post. |
| B-3 | **Voice tone** | Single-select chips: Friendly · Professional · Witty · Inspiring · Academic · Casual. Default Friendly. On-chain enum: see [CONTRACT_SPEC § 3](CONTRACT_SPEC.md#3-enums). |
| B-4 | **Length** | Short (~500 words) · Medium (~900) · Long (~1,400). Default Medium. |
| B-5 | **Key points** | 3–5 text inputs (each ≤ 200 chars). **[+ Add point]** is hidden at 5. Remove (×) is disabled at 3. Drag handle to reorder (HTML5 drag and drop, with ↑/↓ buttons as the keyboard and mobile fallback). Order = section order. |
| B-6 | **Sources** | 0–5 URL inputs. On blur or paste of a valid http(s) URL, call `/extract-url`. Status chip: `Reading…` → `✓ Read · <title>` (green) / `✗ Couldn't read` (red) + a **Paste the text instead** textarea (≤ 3,000 words). The chip number `[n]` = the source's position in the list. |
| B-7 | **Audience** | Optional, ≤ 80 chars. Placeholder: "beginner developers". |
| B-8 | **Generate** | Disabled until there is a topic and ≥ 3 non-empty key points. The hint under the button names what's missing. Also disabled while any source is `Reading…` (hint: "Waiting for sources…"). Sources marked ✗ that have no pasted text are skipped, with a warning line. |
| B-9 | **Re-generate** | If the editor already has content, Generate asks: "Replace current draft? Your current version stays in Undo and My posts." |

### 5.3 Drafting (D)

| ID | Requirement |
|---|---|
| D-1 | `POST /blog/draft` with the brief and source texts. The response is an SSE stream of text deltas ([WORKER_API § 4](WORKER_API.md#4-post-blogdraft-streamed)). |
| D-2 | Markdown streams into the editor live. A blinking caret marks the insertion point and **[Stop]** replaces Generate while streaming. |
| D-3 | Output structure: `# Title`, an `<!-- titles: A | B | C -->` line (parsed into 3 alternative title chips above the editor and removed from the body), intro, one `## H2` per key point in order, `## Conclusion`, `## Sources` as a numbered list `[n] Title — URL`. |
| D-4 | Citations: `[n]` markers in the body render as small pill links. Hovering or focusing one highlights the matching source chip in the brief and the matching line in the Sources list. |
| D-5 | No sources: the draft starts with a callout "⚠ No sources added — check facts before publishing" and contains no specific statistics. There is no Sources section. |
| D-6 | Stop: the partial draft is kept and editable, with a toast "Stopped. Your partial draft is kept." |
| D-7 | Error or rate limit: an inline banner shows the message and **[Retry]**. Editor content from before the request is never lost (snapshot before Generate). |
| D-8 | Clicking a title chip swaps it with the current H1. The old title becomes a chip. |

### 5.4 AI editing (E)

| ID | Requirement |
|---|---|
| E-1 | Selecting ≥ 3 words shows a **floating toolbar**: Rewrite · Shorten · Expand · Change tone ⌄ (the 6 tones) · Simplify · Fix grammar. |
| E-2 | **Panel actions** (under the brief, in an "AI helpers" card): Write intro · Write conclusion · Suggest titles · Add a section for… (opens an inline input: "a section about…"). |
| E-3 | Each call sends the selected text + surrounding paragraph + brief + action to `POST /blog/edit` ([WORKER_API § 5](WORKER_API.md#5-post-blogedit)). |
| E-4 | **Preview:** the suggestion appears as an inline diff card under the selection (old text struck through in muted colour, new text highlighted in a cyan tint) with **[Accept]** / **[Discard]**. Esc = Discard, ⌘/Ctrl+Enter = Accept. |
| E-5 | Accept replaces the range as **one undo step**. ⌘/Ctrl+Z always works. |
| E-6 | Citations stay intact: the client checks that every `[n]` in the selection is still in the suggestion. If one is missing, the preview shows the warning "A citation was removed — check before accepting". |
| E-7 | Write intro / conclusion replaces the existing intro / conclusion if there is one, otherwise inserts it. Add a section inserts an H2 section before the Conclusion. Suggest titles refreshes the 3 title chips. |
| E-8 | Normal typing and a simple formatting toolbar (H2, H3, Bold, Italic, Bullet list, Link, Quote, Undo, Redo) always work, even when the Worker is down. |

### 5.5 Exports (X)

All exports run in the browser.

| ID | Export | Requirement |
|---|---|---|
| X-1 | **Copy → Rich text** | `navigator.clipboard.write([new ClipboardItem({'text/html', 'text/plain'})])`. Fallback: select a hidden rendered node + `document.execCommand('copy')`. Toast "Copied — paste into Docs, Notion or Medium". |
| X-2 | **Copy → Markdown** | Markdown serialised from the editor (Turndown). |
| X-3 | **Copy → Plain text** | `innerText` of the rendered article, with `- ` bullets and `[n]` kept. |
| X-4 | **Download PDF** | html2pdf.js renders a hidden A4 "print" layout: title, byline line "By <short address or 'Author'> · <date>", body, Sources, optional footer line. Filename `<slug>.pdf`. Fallback: `window.print()` with `@media print` CSS. |
| X-5 | **Download .docx** | The `docx` library maps headings, paragraphs, bold/italic, bullet and numbered lists, links (`ExternalHyperlink`), quotes (indented italic) and the Sources list. Filename `<slug>.docx`. Fallback: download `<slug>.md`. |
| X-6 | **AI label** | A toggle "Add 'Written with AI assistance' line to exports" sits in the Copy menu footer and on the Export tab. It is on by default and remembered in localStorage. The line is **excluded** from the fingerprint. |
| X-7 | **Counters** | Word count and reading time (`ceil(words / 238)` min) are always visible in the top bar and update on every change (debounced 150 ms). |

### 5.6 Fingerprint, stamp and proof (P)

| ID | Requirement |
|---|---|
| P-1 | **Fingerprint** = `SHA-256(canonicalText(article))` via `crypto.subtle.digest`, as `bytes32`. The canonicalisation algorithm is in [ARCHITECTURE § 5](ARCHITECTURE.md#5-fingerprint-canonicalisation) (see the decision log § 13). Only the hash and small numbers go on-chain, never the text. |
| P-2 | **[Stamp on BOT Chain]** (black pill): not connected → connect first. Wrong chain → switch. Then call `stamp(textHash, title, words, tone, sources)`. |
| P-3 | Button states: `Stamp on BOT Chain` → `Confirm in MetaMask…` → `Stamping… (view tx ↗)` → `✓ Stamped #12`. Rejected → "Transaction cancelled" + Retry. Failed → the revert reason mapped to plain English + Retry. |
| P-4 | **Proof card** slides in from the right after confirmation. It looks like a receipt: title, words, tone, sources, date, author (short), proof #, tx hash, **[Copy proof link]** (`<site>/verify?proof=12`) and **[View on explorer ↗]** (tx). |
| P-5 | The draft stores `{proofId, hash, txHash, at}`. When the current fingerprint ≠ the last stamped hash, show the badge **Edited since stamp** + **[Stamp new version]**. |
| P-6 | **Version trail:** the proof card lists earlier proofs of the same draft (stored locally) as "v1 #8 · v2 #12". |
| P-7 | Stamping the exact same hash again is allowed (the contract keeps a list), but the UI warns first: "This exact text is already stamped as #12. Stamp again?" |

### 5.7 Verify (V)

| ID | Requirement |
|---|---|
| V-1 | `/verify` has a big textarea "Paste any copy of the article (Markdown or plain text)" and **[Verify]**. |
| V-2 | Compute the canonical hash in the browser → `proofsForHash(hash)` → if there are matches, show the **earliest** proof as the main result ("✓ Matches proof #12 by 0xAB…9f3c, stamped Oct 23, 2026"), then "Also stamped as #15, #20" if there are more. |
| V-3 | No match → "No proof for this exact text. One changed character changes the fingerprint." |
| V-4 | `/verify?proof=12` → read `getProof(12)` → proof card. Unknown id → "Proof not found". Bad param → "That proof link looks broken." |
| V-5 | No wallet needed for anything on `/verify`. |

### 5.8 My posts (M)

| ID | Requirement |
|---|---|
| M-1 | Drafts autosave to localStorage 800 ms after the last change (`ib.drafts.v1`, `ib.current`). Every read and write is wrapped in try/catch, and the app works without storage. |
| M-2 | `/posts` lists drafts with title, updated time, words, a status chip (Draft / Stamped #n / Edited since stamp) and the actions Open · Duplicate · Delete (with confirm). |
| M-3 | If a wallet is connected (or an address is pasted), a second list "Stamped on BOT Chain" reads `proofsOf(address)` → `getProof` for each id, newest first, each with a link to `?proof=`. |
| M-4 | Storage cap: keep the 30 most recent drafts. Warn when storage fails: "Couldn't save in this browser — export to keep your work." |

---

## 6. Core logic

### 6.1 Reading sources

- The Worker fetches the URL and extracts the main article text, readability-style (`@mozilla/readability` + `linkedom`). It returns `{title, text, words, siteName}`, with the text trimmed to **~3,000 words per source**. Reuse Inkprint's `/extract-url` if it is already built and meets these rules.
- **Safety (SSRF guard):** http/https only, ports 80/443 only; block localhost, `*.local`, `*.internal`, `0.0.0.0/8`, `127/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `100.64/10`, IPv6 `::1`, `fc00::/7` and `fe80::/10`; follow redirects manually (max 3) and re-check every hop; 5 s timeout; 2 MB body cap (streamed read); no cookies or credentials sent; accept `text/html` and `text/plain` only.
- If a page can't be read (paywall, blocked, timeout, non-HTML), the chip shows ✗ and the user can paste the text instead.

### 6.2 Drafting

Brief + source texts → `/blog/draft` (streamed). Prompt rules (full prompts in [AI_PROMPTS](AI_PROMPTS.md)):

1. Follow the tone, type, length and key-point order. Each key point = one H2.
2. Use the sources for facts, statistics and quotes, and cite them as `[n]`.
3. Never invent facts, numbers, quotes, names or links. Never output a URL that isn't in the sources.
4. If there are no sources, write from general knowledge with no specific statistics, and start with the "No sources added" note.
5. Output Markdown only.

### 6.3 Editing

Selected text + surrounding paragraph + brief → `/blog/edit` with `action ∈ {rewrite, shorten, expand, tone, simplify, grammar, intro, conclusion, titles, section}`. Keep the `[n]` citations. Return only the replacement text (or a JSON titles array for `titles`).

### 6.4 Exports, fingerprint and drafts

See § 5.5–5.8. The fingerprint is computed in the browser, and only `bytes32` + title + small integers go on-chain.

---

## 7. Writer screen (`/write`) layout

**Desktop (≥ 1024 px)**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◀ InstantBlog   "Why small dApps win…"   1,024 words · 5 min   [Copy ⌄][PDF][.docx] (● Stamp on BOT Chain) [0xAB…] │
├───────────────────────┬──────────────────────────────────────────────────────┤
│ BRIEF (380px card)    │      ┌──────── paper (max 720px) ────────┐           │
│ Topic                 │      │ [title chip][title chip][chip]    │           │
│ Type  [seg control]   │      │ H2 H3 B I • 🔗 ❝ ↶ ↷   Aa Serif   │           │
│ Tone  (chips)         │      │ # Title                           │           │
│ Length (seg)          │      │ intro…                            │           │
│ Key points ⋮⋮ 1 2 3 + │      │ ## Point 1 … [1]                  │           │
│ Sources  ✓ ✓ ✗        │      │ ## Sources                        │           │
│ Audience              │      └───────────────────────────────────┘           │
│ [Generate draft →]    │                                                      │
│ AI HELPERS card       │                                        (proof card ▸)│
└───────────────────────┴──────────────────────────────────────────────────────┘
```

**Mobile (< 768 px):** sticky tabs **Brief · Draft · Export**. Generate switches to the Draft tab automatically. The floating toolbar becomes a bottom sheet. Stamp lives in the Export tab and as a compact pill in the header.

Details: [DESIGN_SYSTEM § 6](DESIGN_SYSTEM.md#6-writer-screen).

---

## 8. Home page (8 sections + footer)

Modelled on the layout rhythm of acctual.com (airy, rounded, product shots doing the talking). It uses our own brand, copy and screenshots. Full copy is in [CONTENT_COPY](CONTENT_COPY.md).

| # | Section | Key content |
|---|---|---|
| 1 | **Hero** | Banner chip "New · Export to Word & PDF" · H1 "Write it once. Publish anywhere." · subtext · black pill **[Write my first post]** · format callouts Blog post · Article · How-to · Listicle with "~500 / 900 / 1,400 words" · overlapping, slightly rotated screenshots (brief panel + editor + export menu) |
| 2 | **Who is it for?** | 6 audience cards with tinted icon chips |
| 3 | **The problem** | "Blank pages are a slow way to start writing" · Slow · Generic · Unsourced |
| 4 | **How it works** | "From idea to finished draft in four steps" · 01 Brief → 02 Draft → 03 Polish → 04 Export & stamp |
| 5 | **Features** | "We designed a faster way to write with sources" · 4 alternating rows, each with a real example output card (no fake testimonials) |
| 6 | **Proof on BOT Chain** | "Prove you wrote it first" · receipt mockup · 3 trust blocks · **[Verify an article]** |
| 7 | **FAQs** | 7 accordion items |
| 8 | **Closing CTA** | "Create a sourced article in seconds" · black pill · 3 fanned sample article mockups |
| — | **Footer** | Receipt card + link footer (§ 11) |

---

## 9. UI direction

Clean, friendly fintech-SaaS look: airy light canvas, rounded headings, white cards, pastel chips, near-black pill buttons. Tokens, type scale and components are in [DESIGN_SYSTEM](DESIGN_SYSTEM.md). **Use only our own logo and screenshots, never Acctual's brand or images.**

---

## 10. States to handle

| Area | State | Behaviour |
|---|---|---|
| Wallet | No MetaMask | Pill → "Install MetaMask" (link). Writing and exports still work. Stamp shows a tooltip explaining why. |
| Wallet | Wrong network | Pill turns amber: "Switch to BOT Chain" → switch/add flow |
| Wallet | Not connected | Everything works. Stamp → "Connect your wallet to stamp" → connect → continue the stamp. |
| Brief | Incomplete | Generate disabled. Hint: "Add a topic" / "Add 1 more key point (3 needed)" |
| Sources | Reading | Chip `Reading…` with spinner. Generate disabled with hint "Waiting for sources…" |
| Sources | Can't read | `✗ Couldn't read` + reason tooltip (Blocked address · Paywall/empty · Timed out · Not a web page · Too large) + **Paste the text instead** |
| Sources | None | Draft works and includes the "No sources added" note |
| AI | Streaming | Typing caret + **[Stop]**. Brief inputs locked. |
| AI | Error / rate limit | Banner: "Couldn't finish the draft — <reason>" + **[Retry]**. On 429: "You've hit the hourly limit (10 drafts). Try again in N min." Content kept. |
| AI | Model declined | "The AI couldn't write this one. Try rephrasing the topic." + Retry |
| Edit | Preview | **[Accept] / [Discard]**. Undo always available. |
| Export | Library failed to load | PDF → `window.print()`. .docx → Markdown download. Toast explains. |
| Export | Clipboard blocked | Fallback to `execCommand('copy')`. If that fails too, a modal with the text pre-selected. |
| Stamp | Edited since stamp | Badge + **[Stamp new version]** |
| Stamp | Pending / rejected / failed | Message + Retry (§ P-3). Insufficient gas → "You need a little BOT for gas." |
| Verify | No match | "No proof for this exact text (one changed character changes the fingerprint)" |
| Verify | Unknown `?proof=` | "Proof not found" |
| Storage | Unavailable | Silent fallback to memory. One-time toast on /posts. |
| Network | RPC down | Footer counter shows "—". Verify shows "Couldn't reach BOT Chain. Try again." |

---

## 11. Footer (required, creative version)

**Concept:** an Acctual-style **receipt card**, "Proof of authorship" for the whole site, above a clean link footer.

- White rounded receipt card (dashed tear line at the top, soft shadow), centred, titled **Proof of authorship**, with invoice-style line items:
  - **Network:** BOT Chain logo + "BOT Chain" → https://botchain.ai (new tab)
  - **Chain ID:** 677
  - **Contract:** `0x12ab…9f3c` (mono, click to copy, toast "Address copied")
  - **Articles stamped:** live `total()` from the contract
  - **Total row:** Status **✓ Verified on-chain** (green)
- Full-width near-black pill **[View on explorer ↗]** → `https://scan.botchain.ai/address/<MAINNET_CONTRACT_ADDRESS>` (new tab)
- Pastel chips: Blog · Article · PDF · Word
- Footer row: InstantBlog logo + "built on BOT Chain". Link groups: **Product** (Write · Verify · My posts · FAQ) · **Guides** (How to write a how-to · Citing sources · Choosing a tone · Export to Word) · **Company** (About · GitHub · Privacy · Terms)
- Bottom line: "© 2026 InstantBlog · AI-assisted writing — always check your facts"
- The contract address lives in **one config constant**. On mobile the receipt is full-width and the link groups stack.
- Guides / About / Privacy / Terms can be short anchor sections or a single `/legal` view for the MVP. Links must not 404.

---

## 12. Out of scope (MVP)

Publishing directly to WordPress or Medium, image generation, SEO scoring, plagiarism checks, team collaboration, accounts, server-side draft storage, scheduled posts, multiple languages, payments, tokens and NFTs.

---

## 13. Decisions and refinements to the brief

| # | Topic | Decision | Why |
|---|---|---|---|
| 1 | **What gets hashed** | The brief says "SHA-256 of normalised Markdown". We hash the **canonical text**: Markdown → rendered → visible text, with list/heading markers and the AI footer line stripped, NFC-normalised and whitespace collapsed ([ARCHITECTURE § 5](ARCHITECTURE.md#5-fingerprint-canonicalisation)). | `/verify` promises "paste *any* copy". A rich-text copy pasted back as plain text has no `##` or `**`, so a raw-Markdown hash would never match it. The canonical text matches Markdown and plain-text copies of the same article. |
| 2 | **Proof ids** | 1-based (`#1` is the first stamp). The `proofs` array is private. Use `getProof(id)`. | "Stamped #0" reads badly, and a public 0-indexed getter next to 1-based ids invites off-by-one bugs. |
| 3 | **Editor** | Tiptap v2 (ESM via esm.sh, pinned) + BubbleMenu. Quill 2 is the fallback if the time box is blown. | Tiptap gives the selection bubble, transactions (one-step undo) and decorations for citation hover. |
| 4 | **Routing on GitHub Pages** | One `index.html` with a tiny router. A deploy step copies it to `write/index.html`, `verify/index.html` and `posts/index.html` (plus `404.html`). | Clean `/write` URLs return HTTP 200 on GitHub Pages, which has no rewrites. |
| 5 | **LLM** | Claude via the Anthropic TypeScript SDK in the Worker. Model `claude-opus-5-5` for drafts (effort `medium`) and edits (effort `low`). Server-side refusal fallback is enabled. | Best grounding quality. One model keeps prompts and caching simple. Details in [WORKER_API § 7](WORKER_API.md#7-llm-configuration). |
| 6 | **Rate limiting** | KV counter per IP per hour bucket (`rl:<ip>:<yyyymmddhh>`, TTL 3,700 s). | The Workers Rate Limiting binding only supports 10 s / 60 s windows, and an approximate count is fine for an MVP. |
| 7 | **Native currency** | `BOT`, 18 decimals | Unconfirmed in official docs. Verify on botchain.ai / chainlist before mainnet (see [DEPLOYMENT](DEPLOYMENT.md)). |

### 13.1 Open questions

1. Is Inkprint's `/extract-url` already deployed with an SSRF guard that meets § 6.1? If yes, reuse it and skip build step 1.2a.
2. Custom domain name (e.g. `instantblog.xyz`)? DNS needs ~10–30 min to propagate, so register it early.
3. The PDF byline uses the short wallet address or "Author". Should we add an optional "Author name" field (local only)? *Proposed: yes, in the Export tab. It costs 5 minutes.*

---

## 14. Honesty note (README + FAQ)

> A proof shows **who stamped this exact text and when**. It does not prove they wrote every word without AI. InstantBlog is an AI-assisted writing tool. Always check your facts before publishing.
