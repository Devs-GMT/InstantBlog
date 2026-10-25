# InstantBlog — Test Plan & Acceptance

Manual QA for a 5-hour build, plus a few automated console checks. Run § 2 on **testnet** first, then the smoke subset (§ 6) on the live mainnet site.

Browsers: Chrome desktop (primary), Safari iOS, Chrome Android, Firefox desktop (clipboard/PDF fallbacks).

---

## 1. Definition-of-done acceptance

| # | Must-have | Test | Pass |
|---|---|---|---|
| A1 | Wallet connect | Connect → short address shown. On chain 1 → auto-switch prompt → 677. Remove 677 from MetaMask → add prompt | ☐ |
| A2 | Core flow | Brief (3 points, 2 URLs) → streamed draft with `[1][2]` → Stamp → tx confirmed → `?proof=n` in a private window shows the card → paste a copy into /verify → ✓ match | ☐ |
| A3 | AI helpers | Every bubble action + every panel action returns a preview. Accept/Discard work. Undo restores | ☐ |
| A4 | Exports | Rich text → Google Docs keeps H2s, bold, links, lists. Markdown + plain text copy. PDF opens. .docx opens in Word and Google Docs with headings | ☐ |
| A5 | Home | 8 sections present and responsive at 375 / 768 / 1280 | ☐ |
| A6 | Mainnet | Contract verified on scan.botchain.ai. The address matches the README and footer | ☐ |
| A7 | Live site | Custom domain over HTTPS. `/write` and `/verify` deep links load (200). The Worker answers from that origin | ☐ |
| A8 | Footer | BOT Chain logo → botchain.ai (new tab). View on explorer → contract (new tab). Counter = `total()` | ☐ |

---

## 2. Functional test cases

### Brief

| ID | Steps | Expected |
|---|---|---|
| T-B1 | Empty form | Generate disabled. Hint "Add a topic to start" |
| T-B2 | Topic + 2 points | Hint "Add 1 more key point — 3 needed" |
| T-B3 | Add 5 points | + Add point hidden. With 3 points the remove buttons are disabled |
| T-B4 | Drag point 3 to the top (and use ↑ on keyboard) | Order changes. The draft H2 order follows it |
| T-B5 | URL `https://en.wikipedia.org/wiki/Hackathon` | Reading… → ✓ Read · Hackathon |
| T-B6 | URL `http://localhost:8080` | ✗ Couldn't read, tooltip "That address isn't allowed." Paste field shown |
| T-B7 | Paywalled / 403 URL | ✗ + paste field. Pasting text turns the chip into "✓ Pasted text" |
| T-B8 | Generate while a source is Reading… | Disabled, "Waiting for sources…" |

### Draft

| ID | Steps | Expected |
|---|---|---|
| T-D1 | Generate with 2 sources | Status "Reading your sources…" → text streams with a caret. H1, 3 title chips, intro, H2 per point, Conclusion, Sources list `[1]…[2]` |
| T-D2 | Generate with 0 sources | Starts with "⚠ No sources added…". No Sources section, no percentages |
| T-D3 | Press Stop halfway | Streaming stops. Partial text stays editable. Toast |
| T-D4 | Worker offline (wrong URL in devtools override) | Error banner + Retry. Previous content intact |
| T-D5 | 11th draft within an hour | 429 copy with the minutes remaining |
| T-D6 | Click an alt title chip | H1 swaps. The old title becomes a chip |
| T-D7 | Hover `[1]` | Source chip 1 and Sources line 1 highlight |
| T-D8 | Generate again over existing content | Replace confirm. Ctrl+Z after replacing restores the old draft |

### Edit

| ID | Steps | Expected |
|---|---|---|
| T-E1 | Select a cited sentence → Shorten | Preview with strike + new text. `[n]` kept. Accept → one undo step |
| T-E2 | Change tone → Witty | Preview in the new tone |
| T-E3 | Fix grammar on "their is a error" | "There is an error" |
| T-E4 | If a suggestion drops `[1]` | Warning "A citation was removed…" |
| T-E5 | Write intro / Write conclusion / Suggest titles / Add a section for "common mistakes" | Replaces or inserts in the right place. Titles refresh the chips |
| T-E6 | Esc and Ctrl+Enter on a preview | Discard / Accept |
| T-E7 | Worker down → toolbar H2/bold/list/link/quote | All still work |

### Export

| ID | Steps | Expected |
|---|---|---|
| T-X1 | Copy rich text → paste into Google Docs, Notion, Medium editor | Headings, lists, links, bold kept |
| T-X2 | Copy Markdown → paste into a .md viewer | Renders the same as the editor |
| T-X3 | Download PDF (1,400 words) | A4, nothing clipped, sources present, AI line present when toggled on |
| T-X4 | Download .docx | Heading styles in Word's navigation pane. Links clickable. Bullets are real lists |
| T-X5 | Toggle the AI line off → export | Line absent. **Fingerprint unchanged** |
| T-X6 | Block the html2pdf CDN (devtools request blocking) | Toast + print dialog |
| T-X7 | Block the docx CDN | Toast + `.md` download |
| T-X8 | Word count / reading time | Matches `wordCount()`. Reading time = ceil(words / 238) |

### Stamp, verify, posts

| ID | Steps | Expected |
|---|---|---|
| T-P1 | No MetaMask (another browser profile) | Pill "Install MetaMask". Stamp explains why. Everything else works |
| T-P2 | Stamp, then reject in MetaMask | "Transaction cancelled." + Try again |
| T-P3 | Stamp → confirm | Pending link → ✓ Stamped #n → proof card. Copy link works |
| T-P4 | Edit one word after stamping | "Edited since stamp" + "Stamp new version" → stamp → version trail v1, v2 |
| T-P5 | Stamp the same unchanged text again | Duplicate warning |
| T-P6 | Title > 160 bytes (e.g. emoji) | Truncated in the dialog. Tx succeeds |
| T-V1 | /verify: paste the Markdown copy | ✓ Matches #n |
| T-V2 | /verify: paste the plain text copied out of Google Docs (after a rich-text paste) | ✓ Matches #n |
| T-V3 | Change one character | No-match message |
| T-V4 | `?proof=99999` / `?proof=abc` | "Proof not found" / "That proof link looks broken." |
| T-M1 | /posts with drafts + connected wallet | Both lists. Open/Duplicate/Delete work |
| T-M2 | Private window with storage disabled | App works. Storage warning shown once |

---

## 3. Responsive and accessibility

| ID | Check |
|---|---|
| R1 | 375 px: no horizontal scroll on any view. Writer tabs work. The bottom-sheet AI toolbar works on touch |
| R2 | 768 px: the brief drawer opens and closes |
| R3 | Keyboard only: complete the brief, generate, select text (Shift+arrows), Alt+/ → AI toolbar, Accept with Ctrl+Enter |
| R4 | Lighthouse on home: Accessibility ≥ 90, Performance ≥ 80 (mobile) |
| R5 | `prefers-reduced-motion`: no parallax or tilts |

---

## 4. Fingerprint test vectors

Run these in the browser console with `canonicalText` / `fingerprint` / `wordCount` from `fingerprint.js`. **Lock these before the mainnet deploy.** If one fails, fix the code, not the vector (unless you bump `FP_VERSION` before launch).

**V1 — Markdown**

```md
# Hello world

Intro with **bold** and a [link](https://x.y) [1].

## Point one

- alpha
- beta

## Sources

1. [1] Example — https://example.com
```

- canonical: `Hello world Intro with bold and a link [1]. Point one alpha beta Sources [1] Example — https://example.com`
- sha256: `0x8e9be5f800ca70a1664c29e22930dbb0a72a634714ca3d04ec7ed568bdb91424`
- wordCount: `12`

**V2 — the same article as a plain-text copy** (must equal V1)

```text
Hello world
Intro with bold and a link [1].
Point one
• alpha
• beta
Sources
1. [1] Example — https://example.com
```

- sha256: `0x8e9be5f800ca70a1664c29e22930dbb0a72a634714ca3d04ec7ed568bdb91424`

**V3 — smart quote, extra spaces, AI line** (`It’s   fine.` + blank line + `*Written with AI assistance*`)

- canonical: `It's fine.`
- sha256: `0x249133e0671a807b46cee298b962b70939bae17be829b6483164d94285b779f6`

**V4 — one character changed** (`It's fine!`)

- sha256: `0xee0a8b602db0a599b826ea606d7604e72a8aa6091741212428516e75e90e7a37` (≠ V3)

```js
// quick console runner
const cases = [[V1, "0x8e9b…1424"], [V2, "0x8e9b…1424"], [V3, "0x2491…79f6"], [V4, "0xee0a…7a37"]];
for (const [input, want] of cases) console.log((await fingerprint(input)).startsWith(want.slice(0, 6)), await fingerprint(input));
```

---

## 5. Worker security tests

See [WORKER_API § 8](WORKER_API.md#8-worker-test-commands). Expected: every private/loopback/metadata URL → `422 blocked_address`; a foreign origin → `403`; a 300 KB body → `413`; the 11th draft per hour → `429`. Check `wrangler tail` while running a draft: **no article text in the logs**.

---

## 6. Live smoke test (5 min, after the mainnet deploy)

1. Open the custom domain on a phone → home renders and the footer counter is live.
2. `/write` deep link → brief → Generate (1 source) → streams.
3. Shorten one paragraph → Accept.
4. Download .docx → opens.
5. Stamp on mainnet → proof card → open the proof link on the laptop without a wallet.
6. Paste the plain-text copy into /verify → ✓ Matches.
7. `git grep -nI "sk-ant\|ANTHROPIC_API_KEY=" ` → nothing.
