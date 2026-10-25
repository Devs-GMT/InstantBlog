# InstantBlog — Design System & UI Spec

Reference mood: **acctual.com**, a clean and friendly fintech-SaaS look. Airy light canvas, rounded headings, white cards, product screenshots doing the talking, small pastel chips and near-black pill buttons.
**Take only the mood and layout rhythm from it. Use our own logo, illustrations and screenshots, never Acctual's brand assets.**

---

## 1. Principles

1. **The product is the hero.** Real screenshots of our own UI beat illustrations.
2. **Calm canvas, one loud thing.** Each section has a single near-black primary action.
3. **Rounded and soft:** pill buttons, 16–20 px card radius, shadows you barely notice.
4. **Trust through receipts.** On-chain proof is shown as a familiar receipt or invoice.
5. **Writing comfort.** The editor paper is quiet: 1.7 line height and a serif option.

---

## 2. Tokens (`web/css/tokens.css`)

```css
:root {
  /* surfaces */
  --bg: #F7FAFC;            /* page */
  --card: #FFFFFF;
  --panel: #FAFAFA;         /* soft panels, inputs */
  --border: rgba(0,0,0,.06);
  --border-strong: rgba(0,0,0,.12);

  /* text */
  --text: #1E1E1E;
  --muted: #666666;
  --faint: #9A9A9A;

  /* actions */
  --primary: #0D111B;       /* near-black pill */
  --primary-hover: #222838;
  --on-primary: #FFFFFF;

  /* pastel tints (chips, icon tiles) */
  --tint-blue:   rgba(0,152,242,.16);   --ink-blue:   #0077C2;
  --tint-pink:   rgba(242,0,201,.16);   --ink-pink:   #B0009A;
  --tint-violet: rgba(108,85,252,.16);  --ink-violet: #5240E0;
  --tint-cyan:   rgba(26,180,215,.16);  --ink-cyan:   #0E8AA6;
  --tint-green:  rgba(44,160,28,.14);   --ink-green:  #1F7A12;
  --tint-amber:  rgba(245,166,35,.18);  --ink-amber:  #9A5B00;
  --tint-red:    rgba(229,57,53,.14);   --ink-red:    #B3261E;

  /* accents */
  --accent: #1AB4D7;        /* cyan — focus, AI suggestion highlight */
  --success: #2CA01C;       /* ✓ Read, ✓ Stamped */

  /* radius */
  --r-pill: 100px; --r-card: 20px; --r-card-sm: 16px; --r-input: 12px; --r-chip: 100px;

  /* shadow */
  --shadow-sm: 0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06);
  --shadow-md: 0 8px 24px rgba(16,24,40,.06), 0 2px 6px rgba(16,24,40,.04);
  --shadow-lg: 0 24px 60px rgba(16,24,40,.10), 0 6px 16px rgba(16,24,40,.06);

  /* type */
  --font-display: "Nunito", ui-rounded, system-ui, sans-serif;
  --font-body: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-serif: "Newsreader", Georgia, serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", monospace;

  /* spacing scale (4px base) */
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px; --s9: 96px;

  --container: 1120px;
  --ease: cubic-bezier(.2,.8,.2,1);
}
body { background: var(--bg); color: var(--text); font: 400 16px/1.6 var(--font-body); }
```

The app is light-only for the MVP (matching the reference). Keep all colours in tokens so a dark theme can be added later.

## 3. Typography

| Role | Font | Size / line height | Weight | Tracking |
|---|---|---|---|---|
| H1 (hero) | Nunito | 40 / 1.1 (mobile 32) · desktop hero may go to 56 | 600 | −1.2px |
| H2 (section) | Nunito | 32 / 1.15 (mobile 26) | 600 | −1px |
| H3 (card title) | Nunito | 20 / 1.3 | 600 | −0.4px |
| Body L | Inter | 18 / 1.6 | 400 | 0 |
| Body | Inter | 16 / 1.6 | 400 | 0 |
| Small / meta | Inter | 13 / 1.4 | 500 | 0 |
| Chip | Inter | 13 / 1 | 500 | 0 |
| Mono (address, hash) | JetBrains Mono | 13 | 500 | 0 |
| Editor body | Inter or **Newsreader** (toggle "Aa Serif") | 18 / 1.7 | 400 | 0 |
| Editor H1 / H2 / H3 | Nunito | 34 / 26 / 21 | 700 / 600 / 600 | −0.8 / −0.5 / −0.3px |

Google Fonts: `Nunito:wght@600;700`, `Inter:wght@400;500;600`, `Newsreader:opsz,wght@6..72,400;6..72,600`, `JetBrains+Mono:wght@500`, with `display=swap`.

## 4. Components

### Buttons

| Variant | Spec |
|---|---|
| **Primary pill** | `--primary` bg, white text, 600 15px, height 44 (lg 52), padding 0 22px, `--r-pill`. Hover `--primary-hover` + translateY(−1px). Active scale(.98). |
| **Secondary pill** | White bg, `1px solid --border-strong`, `--text`. Hover bg `--panel`. |
| **Ghost** | Transparent, `--muted` → `--text` on hover. |
| **Icon button** | 36×36 round, used in the editor toolbar. Active = `--tint-blue` bg. |
| **Stamp pill** | Primary pill + small BOT Chain glyph on the left. Its states are in PRD P-3. Success state = `--success` bg. |

Focus ring everywhere: `outline: 2px solid var(--accent); outline-offset: 2px`.

### Chips

- **Tint chip:** pill, 28 px tall, tint bg + matching ink text, optional 14 px icon. Used for format callouts, tones and footer formats.
- **Selectable chip** (tone): white + hairline border. Selected = `--primary` bg + white text.
- **Status chip** (source): `Reading…` (panel bg + spinner) · `✓ Read · Title…` (green tint, truncated to 28 ch, title in a tooltip) · `✗ Couldn't read` (red tint).
- **Citation pill** `[1]`: inline, 11 px, `--tint-blue` bg, `--ink-blue`, radius 6, superscript-ish baseline (−0.2em). Hover/focus → the matching source chip pulses with a `--accent` ring.

### Inputs

Height 44, `--panel` bg, `1px solid --border`, `--r-input`. Focus: white bg + `--accent` ring. Label 13/500 `--muted` above. Error text 13 `--ink-red` below.

### Cards

`--card` bg, `--r-card`, `--shadow-sm` (hover `--shadow-md`), padding 24 (mobile 20). **Audience card:** a 40×40 tinted icon tile (radius 12) top-left, H3, then one line of muted text.

### Segmented control

A pill track (`--panel`) with equal segments. The selected one is a white thumb + `--shadow-sm`. Used for Type and Length.

### Toast

Bottom-centre, near-black bg, white text, radius 12, auto-hides after 2.5 s. Announced through `aria-live="polite"`.

### Proof receipt (shared by the proof card, the home § 6 mockup and the footer)

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   ← dashed tear line (border-top: 2px dashed --border-strong)
│  Proof of authorship        #12 │      or a zigzag mask via CSS mask-image
│  ───────────────────────────── │
│  Title      Why small dApps…    │      rows: 14px, label --muted, value right-aligned --text
│  Words      1,024               │
│  Tone       Friendly            │
│  Sources    3                   │
│  Date       Oct 23, 2026        │
│  Author     0xAB…9f3c  (mono)   │
│  ───────────────────────────── │
│  Status     ✓ Verified on-chain │      total row: 16px 600, value --success
│  [ View on explorer ↗ ]         │      full-width primary pill
└─────────────────────────────────┘
```

Width 360 (mobile 100%), radius 20, `--shadow-lg`.

---

## 5. Layout and breakpoints

| Name | Width | Notes |
|---|---|---|
| mobile | < 768 | 16 px gutters, single column, writer becomes tabs |
| tablet | 768–1023 | 24 px gutters; writer: brief collapses to a left drawer |
| desktop | ≥ 1024 | 1120 px container, 32 px gutters |

Section vertical rhythm: 96 px desktop / 64 px mobile. There must be no horizontal scroll at 375 px.

---

## 6. Writer screen

### Desktop

- **Top bar** (64 px, sticky, white, bottom hairline): ◀ logo · editable doc title (truncate) · `1,024 words · 5 min read` (muted) · spacer · `[Copy ⌄]` `[PDF]` `[.docx]` (secondary pills, 36 px) · **[Stamp on BOT Chain]** (primary) · wallet pill.
- **Grid:** `grid-template-columns: 380px 1fr; gap: 32px; padding: 32px`.
- **Brief panel:** a white card with an inner scroll (`max-height: calc(100vh - 128px)`). Order: Topic → Type → Voice tone → Length → Key points → Sources → Audience → Generate → AI helpers card.
- **Key point row:** `⋮⋮` drag handle · number badge · input · × remove. A dragged row gets `--shadow-md` and a 2° tilt. The drop target shows a 2 px `--accent` line.
- **Editor column:** title chips row (3 tint-violet chips with a "↻" refresh icon) → formatting toolbar (sticky inside the column) → **paper** (max 720 px, centred, white, radius 20, `--shadow-md`, padding 56/64, min-height 70vh).
- **Floating AI toolbar** (BubbleMenu): near-black capsule, white 13 px labels, separators. `Change tone ⌄` opens a white dropdown of the 6 tone chips. Appears 8 px above the selection.
- **Suggestion preview:** a card under the selection. Header "Suggestion · Shorten". Body: the original struck through in `--faint`, then the new text on a `--tint-cyan` background. Footer: `[Discard]` (ghost) `[Accept]` (primary sm) and kbd hints. While loading: 3 shimmer lines.
- **Streaming:** a 2×20 px caret `--accent`, blinking at 1 s. A status line above the paper says "Reading your sources…" → "Writing section 2 of 4…" (counts `## ` lines) with **[Stop]**.
- **Proof card:** slides in from the right (`translateX(24px)` → 0, opacity, 240 ms `--ease`), fixed top-right under the top bar. It has a close ×.
- **Badges:** "Edited since stamp" = amber tint chip next to the Stamp pill, which then says "Stamp new version".

### Mobile

- Header: logo · words · compact Stamp pill (icon + "Stamp").
- Sticky segmented tabs **Brief · Draft · Export** under the header.
- The paper goes full-bleed (radius 0, padding 20). The formatting toolbar is horizontally scrollable.
- The AI toolbar becomes a **bottom sheet** with large touch targets (min 44 px).
- The Export tab has big rows: Copy rich text · Copy Markdown · Copy plain text · Download PDF · Download Word · AI label toggle · Stamp on BOT Chain.

---

## 7. Home page — section specs

| # | Layout | Visual notes |
|---|---|---|
| Nav | Dark tab (`--primary`) hanging from the top edge, max 900 px, 60 px tall, bottom corners 22 px with concave "ears" joining the top edge (radial-gradient pseudo-elements). Notebook logo (light variant) · links (How it works · Features · Verify · FAQ, white 78% → 100%) · outline wallet pill · white pill **Start writing**. < 1024 px: links go into a menu sheet (absolutely positioned, never pushes content); < 768 px: wallet moves into the sheet. Navbar z-index 60, above decorative mockups | Sticky at top; reference: user-supplied screenshot |
| 1 Hero | Centred column 760 px | Banner chip (`--tint-violet`, "New" in a white mini-pill inside) → H1 56/40 → subtext Body L muted (max 560) → primary pill lg → format callout row: 4 tint chips each with a mono sub-label "~500 w" etc. → **screenshot stack**: 3 shots overlapping (export menu −4°, editor 0° centre front, brief +3°), each `--r-card` + `--shadow-lg`, slight parallax on scroll (≤ 12 px, disabled for `prefers-reduced-motion`) |
| 2 Who | H2 centred + 3×2 grid of audience cards (mobile: 1 col, tablet: 2) | Icon tiles cycle blue / pink / violet / cyan / green / amber |
| 3 Problem | H2 left, 3 blocks in a row, each with a big muted numeral or icon + title + 1 line | White panel band behind it for contrast |
| 4 How | H2 centred + 4 step cards connected by a dashed line (desktop horizontal, mobile vertical) | Step number in a mono tint chip "01" |
| 5 Features | H2 + 4 alternating rows (text left / shot right, then swapped). Text: chip label + H3 + 2 lines + 3 checkmark bullets. Shot: screenshot + a small **example output card** overlapping its corner | Example cards show real snippets the app produced (no invented quotes) |
| 6 Proof | 2 columns: receipt mockup (rotated −2°) · H2 + 3 trust blocks with badge icons + **[Verify an article →]** link | Faint dotted-grid bg |
| 7 FAQ | 2 columns on desktop: H2 + short intro left, accordion right | `<details>/<summary>` with a +/− icon, one open at a time |
| 8 CTA | Rounded near-black band (radius 28, inset 16 px), white H2 + white pill (inverted) + 3 fanned article mockups (−8°, 0°, +8°), each with a tone chip and a "3 sources" badge | The only dark section on the page |
| Footer | Receipt card centred, then the link footer | See § 8 |

---

## 8. Footer spec

```
                ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
                │  Proof of authorship                  │
                │  Network     [◆ BOT Chain] ↗          │  ← logo+name link → botchain.ai (new tab)
                │  Chain ID    677                      │
                │  Contract    0x12ab…9f3c ⧉            │  ← mono, click to copy
                │  Articles stamped   128               │  ← live total(), skeleton while loading, "—" on error
                │  ──────────────────────────────────── │
                │  Status      ✓ Verified on-chain      │  ← green
                │  [        View on explorer ↗        ] │  ← → scan.botchain.ai/address/<addr>
                │  (Blog) (Article) (PDF) (Word)        │  ← pastel chips
                └───────────────────────────────────────┘

  [logo] InstantBlog · built on BOT Chain
  Product            Guides                       Company
  Write              How to write a how-to        About
  Verify             Citing sources               GitHub
  My posts           Choosing a tone              Privacy
  FAQ                Export to Word               Terms
  ────────────────────────────────────────────────────────────
  © 2026 InstantBlog · AI-assisted writing — always check your facts
```

Receipt width 440 px desktop, 100% mobile. Link groups: a 4-column grid (brand + 3 groups) → 2 columns on tablet → stacked on mobile.

---

## 8b. Notebook motifs (use sparingly)

- **Ruled paper** (`.ruled`): faint blue lines every 22 px + red margin line; on product shots, fan cards, the problem band.
- **Spiral binding** (`.spiral`) on the brief shot; **washi tape** (`.taped`) on example cards; **marker highlight** (`.hl`) on one hero phrase; one **handwritten margin note** in Caveat (`--font-hand`), desktop only.
- Icons: Lucide (ISC licence) notebook/writing set: NotebookPen, Feather, GraduationCap, Megaphone, Newspaper, FileCode, Timer, Fingerprint, Clock, ShieldCheck.
- Logo: notebook mark (spiral rings, ruled lines, pen) in `components/Brand.tsx` and `public/logo-mark.svg`.

## 9. Motion

- Default transition 160 ms `--ease` for hover/focus. Panels and cards use 240 ms.
- Streaming caret blink. Stamp success: the receipt "prints" (it slides down from behind the top bar, clip-path reveal, 400 ms) and a ✓ check draws in.
- Respect `prefers-reduced-motion: reduce`: no parallax, no tilt animations, fades only.

## 10. Accessibility

- Contrast ≥ 4.5:1 for text. Check the tint chip ink colours (the `--ink-*` values were chosen for this).
- All controls are reachable by keyboard. The key-point reorder has ↑/↓ buttons (`aria-label="Move point 2 up"`).
- The BubbleMenu is keyboard-reachable: after selecting text, **Alt+/** focuses the AI toolbar.
- Status chips and streaming status use `aria-live="polite"`. The proof card has `role="dialog"` with focus moved to its heading.
- Citation pills are `<a href="#src-1" aria-label="Source 1: <title>">`.

## 11. Asset list (make these yourself)

| Asset | Spec |
|---|---|
| `logo.svg` | Wordmark "InstantBlog" in Nunito 700 + a glyph: a rounded page with a lightning-fold corner |
| `favicon.svg` | The glyph only, near-black on transparent |
| `botchain-logo.svg` | The official BOT Chain mark from their brand kit / site (used only as the network link) |
| `shots/*.webp` | 2× retina screenshots of our own UI with demo content, 1600 px wide, about 120 KB each |
| `og.png` | 1200×630: hero headline + editor shot |
