# InstantBlog — full walkthrough demo

**Format:** landscape 1920×1080, 30 fps, ~54.7 s (a full demo; the user asked for 30–60 s, English).
**Tone:** `polished` screen demo — one continuous browser window, camera punch-ins on the action, numbered step lower-thirds. Calm, readable, no hype.
**Angle:** "Watch one article go from idea to proof." One take, seven steps, the real UI doing its job.

## Rubric

- **What:** AI writer — brief → cited draft → AI edits → Copy/PDF/.docx → SHA-256 fingerprint stamped on BOT Chain → anyone verifies a copy.
- **For:** students, creators, founders, marketers, DevRel, hackathon teams.
- **Apart:** facts only from your sources, cited [1]; AI edits wait for Accept; real Word/PDF; on-chain proof without putting text on-chain.
- **Hook:** the promise as a title — "Watch one article go from idea to proof." — then straight into the browser.
- **Real UI:** landing hero → `/write/` (topbar, brief panel, editor, AI bubble, suggestion card, Copy menu, toast, stamp button states, proof card) → `/verify/` (textarea, Verify, match result). All markup/classes from `web/components/*` and `web/app/styles/app.css`.
- **Share line:** "One article, start to finish: brief, cited draft, AI edit, export, on-chain proof, verify."

## Illustrative values (fiction, flagged)

The article is the landing sample (`sample.ts`) plus the start of a third section for the third key point. The word counter (912 → 908), the alt titles, the proof number (#3), and its date (Oct 27, 2026) are illustrative — the edited text is not a real stamped proof. The author address is the project's own public address the site already shows (shortened). No MetaMask UI is depicted, only the app's own button label.

## Music

`happy-beats-business-moves-vol-9` (Sascha Ende, CC BY 4.0), fitted grid 114.00 BPM, beat 0.5263 s, bar 2.1053 s; trimmed in at 1.067 s (beat 0). Every step boundary is a bar line. Soft clicks/keys under the bed; one bell on "✓ Stamped".

## Storyboard (bars → s)

| Bars | Time | Step | Action | Lower-third |
|---|---|---|---|---|
| 0–2 | 0.00–4.21 | Hook | Title on dotted ground, browser window rises | — |
| 2–4 | 4.21–8.42 | 01 | Landing hero at instantblog.my.id; cursor clicks "Write my first post" | 01 · Open instantblog.my.id — Free. No sign-up. |
| 4–9 | 8.42–18.95 | 02 | /write/: camera on brief — topic typed, Opinion, Friendly, Medium, 3 key points, source read ✓ | 02 · Fill in the brief |
| 9–13 | 18.95–27.37 | 03 | Generate → "Reading your sources…" → draft streams with [1] → title ideas | 03 · Generate a cited draft |
| 13–16 | 27.37–33.68 | 04 | Select sentence → Shorten → suggestion → Accept | 04 · Polish with AI |
| 16–18 | 33.68–37.89 | 05 | Copy ▾ → Rich text → toast; .docx | 05 · Copy or download |
| 18–21 | 37.89–44.21 | 06 | Stamp on BOT Chain → Confirm… → Stamping… → ✓ Stamped #3, proof card | 06 · Stamp it on BOT Chain |
| 21–23 | 44.21–48.42 | 07 | /verify/: paste, Verify → ✓ Matches proof #3 | 07 · Anyone can verify a copy |
| 23–26 | 48.42–54.74 | Outro | Dark end card: Write my first post · instantblog.my.id | — |
