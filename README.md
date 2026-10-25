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
| `contracts/` | Foundry project: `src/InstantBlog.sol` (no tokens, no payments, no admin), tests and deploy script |
| `web/` | The website — a Next.js static export on GitHub Pages: home, writer, verify, my posts |
| `worker/` | Cloudflare Worker: reads source links and talks to the AI. The API key is a Worker secret, **never in this repo**. |
| `tests/` | Fingerprint test vectors (the hash must never change after launch) |
| `docs/` | Product and build documentation ([start here](docs/README.md)) |

## Tech

Next.js 16 (static export) · React 19 · Tiptap editor · marked · html2pdf.js · docx · ethers.js v6 · Cloudflare Workers · Claude (Anthropic API) · Solidity 0.8.24 on BOT Chain

## Run it yourself

```bash
# 1. Worker (local, no API key needed with the mock AI)
cd worker && npm ci && cp .dev.vars.example .dev.vars   # add MOCK_AI=1 to try it without a key
npx wrangler dev --port 8787

# 2. Website
cd web && npm ci && npm run dev                         # http://localhost:5173

# 3. Tests
cd tests && npm ci && node --test
```

To go live: deploy the contract with Foundry (`forge script script/Deploy.s.sol --broadcast`, see DEPLOYMENT), deploy the Worker with `npx wrangler deploy`, set the contract address and Worker URL as GitHub Actions variables, and push — the Pages workflow builds and publishes `web/`. Full steps: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Privacy

Drafts are saved only in your browser. Text you send to draft or edit is processed by our Worker and the AI provider. It is not stored or logged by us. Stamping makes the fingerprint, the title, the numbers shown and your wallet address public on BOT Chain, permanently.

## Licence

MIT
