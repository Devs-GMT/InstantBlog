# InstantBlog — Content & UI Copy

This file holds every user-facing string, so it can be pasted straight into the build. Voice: friendly, plain and short. Use sentence case.

**Copy rules (anti AI-slop):** no em dashes in short UI copy; none of the words seamless, unlock, elevate, empower, leverage, supercharge, robust, delve, game-changer; no rhetorical questions, faux-insight setups or cute kicker lines; no claim we can't back ("in seconds", "prove you wrote it"); and **never invented data in mockups**: sample content must be real (see `web/components/home/sample.ts`, stamped on testnet as proof #2) and testimonials only from real testers with permission.

---

## 1. Meta

- `<title>`: InstantBlog: write a sourced article in minutes
- Description: Pick a topic, a tone and your key points. InstantBlog drafts a sourced article with citations. Copy it or download PDF or Word, then stamp a timestamped proof on BOT Chain.
- OG title: Write it once. Publish anywhere.

## 2. Navbar

Dark tab hanging from the top edge: logo (notebook mark) · How it works · Features · Verify · FAQ · outline pill wallet button (`Connect wallet` / `0xAB…9f3c` / `Switch to BOT Chain` / `Install MetaMask`) · white pill **[Start writing]**. Below 1024 px the links move into a menu sheet that floats over the page; below 768 px the wallet button moves into that sheet as a full-width white button.

---

## 3. Home

### § 1 Hero
- Banner chip: **New** · Export to Word & PDF
- H1: **Write it once.** / **Publish anywhere.** (second line highlighted like a marker pen)
- Sub: Pick a topic, a tone and your key points. InstantBlog drafts a sourced article in under a minute. Copy it, or download it as PDF or Word.
- CTA: **Write my first post**
- Under CTA (small, muted): Free. No sign-up. You only need a wallet to stamp.
- Type chips: Blog post · Article · How-to · Listicle · Opinion — then mono line `~500 · ~900 · ~1,400 words`
- Handwritten margin note (desktop only): every fact gets a source

### § 2 Who is it for?
- H2: **Who is it for?**
- Sub: People who already have the ideas and the links, and want the first draft done.

| Card | Line |
|---|---|
| Students | Essays and research summaries, with each fact tied to a reading you can cite. |
| Creators | Newsletters and blog posts in the tone you pick: friendly, witty or casual. |
| Founders | Launch posts and product updates drafted from your notes and changelog links. |
| Marketers | SEO articles from product pages and reports, with the sources listed at the end. |
| Developers / DevRel | Tutorials and changelogs drafted from your docs and pull requests. |
| Hackathon teams | The project write-up for the submission form, written while the demo is fresh. |

### § 3 The problem
- H2: **Blank pages are a slow way to start writing**
- **Slow:** A first draft can take hours before any editing starts.
- **Generic:** Most AI text reads the same whatever topic you give it.
- **Unsourced:** A number with no link is hard to check and risky to publish.

### § 4 How it works
- H2: **From idea to finished draft in four steps**
- **01 Brief:** Topic, tone, 3 to 5 key points and up to 5 source links.
- **02 Draft:** The AI writes one section per point and cites your sources as [1], [2].
- **03 Polish:** Select a sentence to rewrite it, shorten it or change its tone.
- **04 Export & stamp:** Copy it, download PDF or Word, then stamp a proof on BOT Chain.

### § 5 Features
- H2: **Built for writing with sources**

| Row | Chip | H3 | Body | Bullets |
|---|---|---|---|---|
| 1 | Outline | Your key points become the sections | Each point gets its own heading, in the order you set. Drag a point up or down before you generate. | Intro, conclusion and three title ideas included · Short, medium or long: about 500, 900 or 1,400 words |
| 2 | Citations | Every fact links back to a source | InstantBlog reads the pages you link and cites them inline. Hover a [1] in the editor to see which source it points to. | Facts and numbers come only from your sources · If a page won't load, paste its text instead |
| 3 | AI editing | Edit with AI, keep your voice | Select text and pick Rewrite, Shorten, Expand, Simplify or a new tone. Nothing changes until you press Accept. | Citations stay attached to their sentence · Undo works on every change |
| 4 | Export | Paste into Docs, Notion or Medium, or download PDF and Word | Rich text keeps headings, links and lists. The .docx uses real Word heading styles, so the navigation pane works. | Rich text, Markdown or plain text · A4 PDF with a byline and the sources |

Example cards (taped notes) all use the real sample article: its outline, its cited sentence with `[1] Hackathon · Wikipedia`, a Shorten preview of one of its sentences, and its .docx filename.

### § 6 Proof on BOT Chain
- H2: **Stamp it before you publish**
- Sub: InstantBlog saves your article's fingerprint on BOT Chain. Anyone can check a copy against it later without seeing your text.
- **Only the fingerprint goes on-chain:** A SHA-256 hash, the title and a few counts. The article text stays in your browser.
- **Timestamped on-chain:** The proof records your wallet address and the block time.
- **Anyone can verify a copy:** Paste a copy into Verify. One changed character means no match.
- Links: **Verify an article →** · **See the sample proof →** (`/verify/?proof=2` while on testnet)
- Fine print: A proof shows who stamped this exact text and when. It does not show that every word was written without AI.
- Receipt: the real proof #2 of the sample article (testnet), button **Open this proof**.

### § 7 FAQs
- H2: **Questions, answered** · side text: The code is open source on GitHub.

| Q | A |
|---|---|
| Is it free? | Yes. Writing, editing and exports are free. Stamping costs a small network fee in BOT, paid from your own wallet. Hourly limits keep the AI available for everyone. |
| Which AI does it use? | Google Gemini (a Flash model on the free tier). Google may use free-tier text to improve its products, so don't paste anything confidential into a brief. |
| Does the AI make things up? | It is told to take facts, numbers and quotes only from your sources and to cite each one. It can still get things wrong, so check the facts before you publish. The citations show you where to look. Without sources, the draft says so at the top. |
| Which sources can it read? | Most public pages: blogs, news, docs and Wikipedia. It can't read paywalled, login-only or private pages, so paste their text instead. Up to 5 sources per article. |
| Can I edit the draft? | Yes. Type anywhere, use the toolbar for headings, lists and links, or select text and ask the AI to rewrite, shorten, expand, simplify or change the tone. Every AI change waits for you to accept it. |
| Which formats can I download? | PDF and Word (.docx). You can also copy rich text for Google Docs, Notion or Medium, or copy Markdown or plain text. |
| What goes on BOT Chain? | A SHA-256 fingerprint of your article, its title, word count, tone, number of sources, your wallet address and the time. The article text never goes on-chain. |
| Do I need a wallet? | Only to stamp. Writing, editing, downloading and verifying work without one. |

### § 8 Closing CTA
- H2: **Write your first sourced article**
- Sub: Bring a topic, three key points and a few links.
- CTA: **Write my first post**
- Fanned ruled-paper cards (example briefs): "How to deploy your first contract" (How-to · Friendly · 3 sources) · "7 tools every hackathon team needs" (Listicle · Witty · 3 sources) · "Small dApps win hackathons" (Opinion · Inspiring · 3 sources)

### Footer
- Receipt title: **Proof of authorship** · rows Network (BOT Chain / BOT Chain testnet) / Chain ID / Contract / Articles stamped / Status **✓ Live on-chain** · **View on explorer ↗**
- Chips: Blog · Article · PDF · Word
- Brand line: InstantBlog · built on BOT Chain
- Bottom: © 2026 InstantBlog · AI-assisted writing. Always check your facts.

---

## 4. Writer (`/write`)

| Element | Copy |
|---|---|
| Panel title | Your brief |
| Topic label / placeholder | What's it about? / Why small dApps win hackathons |
| Type | Blog post · Article · How-to guide · Listicle · Opinion |
| Tone label | Voice tone |
| Length | Short ~500 · Medium ~900 · Long ~1,400 |
| Key points label / helper | Key points (3–5) / Each point becomes a section. Drag to reorder. |
| Point placeholder | e.g. "Small scope is a feature" (point 1; the number badge says which point) |
| Add | + Add point |
| Sources label / helper | Sources (up to 5) / Facts in your draft will come from these links. |
| Source placeholder | https://… |
| Source chips | Reading… · ✓ Read · {title} · ✗ Couldn't read |
| Paste fallback | Paste the text instead · placeholder "Paste the article text here (up to 3,000 words)" |
| Read errors (tooltip) | blocked_address: "That address isn't allowed." · timeout: "The page took too long to respond." · too_large: "The page is too large to read." · not_html: "That link isn't a web page." · http_error: "The page returned an error." · empty: "We couldn't find article text on that page." |
| Audience | Audience (optional) / beginner developers |
| Generate | Generate draft → |
| Generate hints | Add a topic to start · Add {n} more key point(s) — 3 needed · Waiting for sources… |
| Skipped warning | {n} source(s) couldn't be read and will be skipped. |
| Replace confirm | Replace current draft? Your current version stays in Undo and My posts. [Replace] [Cancel] |
| Streaming status | Reading your sources… · Writing section {i} of {n}… · [Stop] |
| Stopped toast | Stopped. Your partial draft is kept. |
| Empty editor | Your draft will appear here. Fill in the brief and hit Generate — or just start typing. |
| No-source note | ⚠ No sources added — check facts before publishing. |
| Bad citation | ⚠ This draft cites a source that doesn't exist: [{n}]. Check it before publishing. |
| Cut off | The draft was cut off before the end. You can write the rest or regenerate. |
| AI helpers card | AI helpers · Write intro · Write conclusion · Suggest titles · Add a section for… |
| Section input | Add a section about… [Write it] |
| Bubble menu | Rewrite · Shorten · Expand · Change tone ⌄ · Simplify · Fix grammar |
| Preview | Suggestion · {action} · [Discard] [Accept] · Esc · ⌘↵ |
| Citation warning | A citation was removed — check before accepting. |
| Counters | {n} words · {m} min read |
| Copy menu | Rich text — for Docs, Notion, Medium · Markdown · Plain text · ☑ Add "Written with AI assistance" |
| Copied toast | Copied — paste into Docs, Notion or Medium · Markdown copied · Plain text copied |
| PDF / Word | Download PDF · Download .docx |
| Lib fail | PDF tools didn't load — opening print instead. Choose "Save as PDF". · Word export didn't load — downloaded Markdown instead. |
| Serif toggle | Aa Serif |

## 5. Stamp

| State | Copy |
|---|---|
| Idle | Stamp on BOT Chain |
| Not connected | Connect your wallet to stamp |
| Confirm dialog | **Stamp this version?** Your title, word count and wallet address will be public on BOT Chain. The article text stays private. · Title: {title} · {words} words · [Stamp] [Cancel] |
| Already stamped | This exact text is already stamped as #{id}. Stamp again? |
| Wallet | Confirm in MetaMask… |
| Pending | Stamping… · view tx ↗ |
| Success | ✓ Stamped #{id} |
| Proof card | Stamped #{id} · {date} · {words} words · [Copy proof link] · [View on explorer ↗] · Versions: v1 #{a} · v2 #{b} |
| Link copied | Proof link copied |
| Edited | Edited since stamp · [Stamp new version] |
| Rejected | Transaction cancelled. [Try again] |
| No gas | You need a little BOT for gas. |
| Failed | Stamp failed. [Try again] |

## 6. Verify (`/verify`)

| Element | Copy |
|---|---|
| H1 | Verify an article |
| Sub | Paste any copy of an article. We'll check its fingerprint against proofs on BOT Chain — nothing you paste leaves your browser. |
| Textarea | Paste the article text (Markdown or plain text) |
| Button | Verify |
| Match | ✓ Matches proof #{id} by {short}, stamped {date} · Also stamped as #{x}, #{y} |
| No match | No proof for this exact text. One changed character changes the fingerprint. |
| Proof not found | Proof not found. Check the link and try again. |
| Bad link | That proof link looks broken. |
| RPC down | Couldn't reach BOT Chain. Try again in a moment. |

## 7. My posts (`/posts`)

| Element | Copy |
|---|---|
| H1 | My posts |
| Tabs | Drafts in this browser · Stamped on BOT Chain |
| Empty drafts | No drafts yet. [Write my first post] |
| Empty proofs | Connect your wallet to see the articles you've stamped. |
| Row actions | Open · Duplicate · Delete |
| Delete confirm | Delete "{title}"? This can't be undone. |
| Storage off | Couldn't save in this browser — export to keep your work. |

## 8. Errors (AI)

| Code | Copy |
|---|---|
| rate_limited | You've hit the hourly limit ({limit}). Try again in {m} min. |
| upstream / overloaded | The AI is busy right now. [Retry] |
| refusal | The AI couldn't write this one. Try rephrasing the topic. [Retry] |
| network | You seem to be offline. Your draft is safe. [Retry] |
| too_large | That's too much text for one request. Try fewer or shorter sources. |

## 9. Export footer line

`Written with AI assistance` (italic, muted, after the Sources list).

## 10. Legal stubs (short, honest)

- **Privacy:** Drafts are saved only in your browser. To draft and edit, the text you send goes through our server to Google's Gemini API. We don't store or log it. On Gemini's free tier, Google may use it to improve its products and human reviewers may read it, so don't paste anything confidential. Stamping publishes a fingerprint, the title, the numbers shown and your wallet address on a public blockchain, permanently.
- **Terms:** InstantBlog is provided as-is. You're responsible for what you publish. AI can be wrong — check facts and respect the sources' copyright.
