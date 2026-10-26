# InstantBlog

**Write a sourced blog post or article in minutes.** Pick a topic, a tone and 3–5 key points, and add your source links. The AI drafts the post with citations and helps you polish it. You can copy it or download it as PDF or Word, then stamp proof that you wrote it on **BOT Chain**.

- 🌐 **Live:** https://instantblog.vercel.app  <!-- TODO: confirm Vercel domain -->
- 📜 **Contract (BOT Chain mainnet, chain ID 677):** `0x0000000000000000000000000000000000000000` → [view on scan.botchain.ai](https://scan.botchain.ai/address/0x0000000000000000000000000000000000000000)  <!-- TODO -->
- 🧪 **Contract (BOT Chain testnet, chain ID 968):** `0x4625aF5b93bB0C53Af096E34005b9E32Cb61F72a` → [view on scan.bohr.life](https://scan.bohr.life/address/0x4625aF5b93bB0C53Af096E34005b9E32Cb61F72a)

---

## How it works

1. **Brief.** Choose a topic, a type (blog post, article, how-to, listicle, opinion), a voice tone, a length, 3–5 key points and up to 5 source links.
2. **Draft.** Our server reads your sources and an AI (Google Gemini) writes the article. Each key point becomes a section. Facts from your sources carry citations like [1][2], and a Sources list is added at the end.
3. **Polish.** Select any text to Rewrite, Shorten, Expand, Change tone, Simplify or Fix grammar. You see a preview first and choose Accept or Discard.
4. **Export.** Copy rich text (for Google Docs, Notion, Medium), Markdown or plain text, or download PDF or Word (.docx). All of this happens in your browser.
5. **Stamp.** Click *Stamp on BOT Chain*. Your browser computes a SHA-256 fingerprint of the article. The fingerprint, the title, the word count, the tone and the number of sources are saved on-chain with a timestamp. **Your article text is never put on-chain.**
6. **Verify.** Anyone can paste a copy of the article at `/verify` to check it against a proof, or open `/verify?proof=12` to see a proof card. No wallet needed.

> **What a proof means:** a proof shows **who stamped this exact text and when**. It does **not** prove that they wrote every word without AI. InstantBlog is an AI-assisted writing tool. Always check your facts before publishing.

## What's in this repo

| Path | What |
|---|---|
| `contracts/` | Foundry project: `src/InstantBlog.sol` (no tokens, no payments, no admin), tests and deploy script |
| `web/` | The whole app — Next.js on Vercel from `main`: pages (home, writer, verify, my posts) and the API (`/api/*`: reads source links, talks to Gemini). The Gemini key is a server env var, **never in this repo**. |
| `tests/` | Fingerprint test vectors (the hash must never change after launch) |
| `docs/` | Product and build documentation ([start here](docs/README.md)) |

## Tech

Next.js 16 on Vercel (pages + API routes) · React 19 · Tiptap editor · marked · html2pdf.js · docx · ethers.js v6 · Google Gemini API (free tier) · Solidity 0.8.24 on BOT Chain

## Run it yourself

```bash
# 1. App (pages + API)
cd web && pnpm install && cp .env.example .env.local   # free Gemini key from aistudio.google.com/apikey, or MOCK_AI=1
pnpm dev                                                # http://localhost:3000

# 2. Tests
cd tests && pnpm install && node --test
```

To go live: deploy the contract with Foundry (`forge script script/Deploy.s.sol --broadcast`, see DEPLOYMENT), import the repo in Vercel with Root Directory `web`, set `GEMINI_API_KEY` (and later the mainnet contract address) as env vars, and push to `main`. One deploy covers the site and the API. Full steps: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Privacy

Drafts are saved only in your browser. Text you send to draft or edit goes through our server to Google's Gemini API. We don't store or log it, but on Gemini's free tier Google may use it to improve its products, so don't paste anything confidential. Stamping makes the fingerprint, the title, the numbers shown and your wallet address public on BOT Chain, permanently.

## Licence

MIT
