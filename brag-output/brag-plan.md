# InstantBlog — launch ad plan

**Format:** landscape 1920×1080, 30 fps, ~44 s (user asked for 30–60 s, English).
**Tone:** `app-store` crossed with the site's own notebook personality — clean feature cards, ruled paper, sticky notes, one handwritten aside. Calm confidence, not hype.
**Live URL:** https://www.instantblog.my.id/

## Rubric

- **What is it?** An AI writer that turns a short brief (topic, tone, 3–5 key points, up to 5 links) into a cited Markdown article, then exports it and can stamp its fingerprint on BOT Chain.
- **Who for / what it does for them?** Students, creators, founders, marketers, DevRel, hackathon teams — people who have the ideas and the links and want the first draft done.
- **What sets it apart?** Every fact is cited to a source you gave it ([1], [2]); AI edits wait for Accept; exports to real Word/PDF; on-chain proof of authorship that anyone can verify without seeing the text.
- **Most impressive claim:** "drafts a sourced article in under a minute" + "One changed character means no match."
- **Visual hook:** a blank ruled notebook page with a blinking caret — the thing every writer dreads.
- **Real UI/flow:** Brief panel → Generate → streamed draft with [1] cite → select sentence → Shorten → Accept → Export menu (Copied ✓, .docx) → Proof-of-authorship receipt.
- **Share caption:** "Brief in. Cited article out. InstantBlog drafts a sourced post in under a minute, exports to Word & PDF, and stamps proof on BOT Chain."

Everything shown is the site's real sample (`sample.ts`, stamped as mainnet proof #1) and real UI copy. The author address is the public on-chain address the site itself shows, shortened.

## Angle

"The blank page, solved — with receipts." Open on the pain (blank page), name the three problems the site names (Slow · Generic · Unsourced), then answer each with the product doing its job, and close on the proof receipt + URL.

## Music

`happy-beats-business-moves-vol-1` (Sascha Ende, CC BY 4.0), 120.19 BPM. Trim in at 3.0186 s (first strong beat) so beat 0 = frame 0. Beat B = 0.4992 s, bar = 1.9967 s. Every scene cut lands on a bar line. 1.5 s fade out at the end.

## Storyboard (bars → seconds)

| # | Bars | Time | Scene | On screen | Sound |
|---|---|---|---|---|---|
| 1 | 0–2 | 0.00–3.99 | **Hook** | Ruled page, red margin, caret blinks; types "Blank pages are a slow way to start writing." | soft key ticks under music |
| 2 | 2–4 | 3.99–7.99 | **Problem** | Three slams on beats: "Slow." "Generic." "Unsourced." with the site's one-line explanations | soft impact on each |
| 3 | 4–6 | 7.99–11.98 | **Reveal** | Logo mark + InstantBlog; "Write it once. **Publish anywhere.**" yellow highlighter sweep | major reveal impact |
| 4 | 6–9 | 11.98–17.97 | **01 Brief** | Real brief panel fills: topic typed, Friendly tone, 3 key points, source "✓ Read · Hackathon (Wikipedia)", cursor clicks Generate | clicks |
| 5 | 9–12 | 17.97–23.96 | **02 Draft** | Paper streams the sample article word-by-word; [1] cite pops; hand note "every fact gets a source" | — (music carries) |
| 6 | 12–15 | 23.96–29.95 | **03 Polish** | Sentence selected → AI bubble → Shorten → preview old/new → Accept | clicks |
| 7 | 15–17 | 29.95–33.94 | **04 Export** | Export menu: Rich text Copied ✓, PDF, .docx → "Downloaded why-small-dapps-win-hackathons.docx" sticky | clicks |
| 8 | 17–19 | 33.94–37.94 | **Stamp** | Proof-of-authorship receipt prints; "Only the fingerprint goes on-chain. Anyone can verify a copy." | bell on ✓ On-chain |
| 9 | 19–22 | 37.94–43.93 | **Outro** | Dark band: "Write your first sourced article" · button "Write my first post" · instantblog.my.id · "Free. No sign-up." | reveal impact, fade |

## Visual identity

Tokens from `web/app/styles/tokens.css`: bg #F7FAFC, primary #0D111B, accent #1AB4D7, tints/inks blue/violet/pink/cyan/green; Nunito display, Inter body, JetBrains Mono, Caveat for the one hand note. Ruled paper + red margin, sticky notes with tape, receipt with dashed top edge. UI pieces reuse the site's real CSS classes (scaled with `zoom`).
