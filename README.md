# InstantBlog

**Write a sourced blog post or article in minutes.** Pick a topic, a tone and 3–5 key points, and add your source links. The AI drafts the post with citations and helps you polish it. You can copy it or download it as PDF or Word, then stamp proof that you wrote it on **BOT Chain**.

- 🌐 **Live:** https://instantblog.xyz  <!-- TODO -->
- 📜 **Contract (BOT Chain mainnet, chain ID 677):** `0x0000000000000000000000000000000000000000` → [view on scan.botchain.ai](https://scan.botchain.ai/address/0x0000000000000000000000000000000000000000)  <!-- TODO -->

---

## How it works

1. **Brief.** Choose a topic, a type (blog post, article, how-to, listicle, opinion), a voice tone, a length, 3–5 key points and up to 5 source links.
2. **Draft.** Our server reads your sources and an AI (Claude) writes the article. Each key point becomes a section. Facts from your sources carry citations like [1][2], and a Sources list is added at the end.
3. **Polish.** Select any text to Rewrite, Shorten, Expand, Change tone, Simplify or Fix grammar. You see a preview first and choose Accept or Discard.
4. **Export.** Copy rich text (for Google Docs, Notion, Medium), Markdown or plain text, or download PDF or Word (.docx). All of this happens in your browser.
5. **Stamp.** Click *Stamp on BOT Chain*. Your browser computes a SHA-256 fingerprint of the article. The fingerprint, the title, the word count, the tone and the number of sources are saved on-chain with a timestamp. **Your article text is never put on-chain.**
6. **Verify.** Anyone can paste a copy of the article at `/verify` to check it against a proof, or open `/verify?proof=12` to see a proof card. No wallet needed.

> **What a proof means:** a proof shows **who stamped this exact text and when**. It does **not** prove that they wrote every word without AI. InstantBlog is an AI-assisted writing tool. Always check your facts before publishing.

## What's in this repo

| Path | What |
|---|---|
| `contracts/InstantBlog.sol` | The smart contract. No tokens, no payments, no admin. |
| `web/` | The static website (GitHub Pages): home, writer, verify, my posts |
| `worker/` | Cloudflare Worker: reads source links and talks to the AI. The API key is a Worker secret, **never in this repo**. |
| `docs/` | Product and build documentation ([start here](docs/README.md)) |

## Tech

HTML/CSS/JS · Tiptap editor · marked · html2pdf.js · docx · ethers.js v6 · Cloudflare Workers · Claude (Anthropic API) · Solidity 0.8.24 on BOT Chain

## Run it yourself

1. Deploy `contracts/InstantBlog.sol` with Remix (EVM version *paris*) and put the address in `web/js/config.js`.
2. `cd worker && npm i && npx wrangler secret put ANTHROPIC_API_KEY && npx wrangler deploy`, then put the Worker URL in `web/js/config.js`.
3. Serve `web/` with any static server, or push it to GitHub Pages.

Full steps: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Privacy

Drafts are saved only in your browser. Text you send to draft or edit is processed by our Worker and the AI provider. It is not stored or logged by us. Stamping makes the fingerprint, the title, the numbers shown and your wallet address public on BOT Chain, permanently.

## Licence

MIT
