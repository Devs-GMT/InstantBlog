# CLAUDE.md — InstantBlog

AI blog/article writer: brief (topic, type, tone, length, 3–5 key points, 0–5 source URLs) → Worker reads sources → Claude streams a cited Markdown draft → AI edits on selected text (preview + Accept/Discard) → Copy / PDF / .docx → stamp a SHA-256 fingerprint on BOT Chain → anyone verifies a copy at `/verify`.

## Where things are specified

Read the relevant doc before building a part; the docs are the source of truth.

- Requirements + IDs (W-, B-, D-, E-, X-, P-, V-, M-): `docs/PRD.md`
- Phase order, checkpoints, cut lines: `docs/BUILD_PLAN.md`
- Repo layout, libs, data model, fingerprint, config: `docs/ARCHITECTURE.md`
- Contract + ABI + Remix settings: `docs/CONTRACT_SPEC.md`
- Worker routes, SSE protocol, SSRF guard, LLM config: `docs/WORKER_API.md`
- Prompts: `docs/AI_PROMPTS.md` · UI tokens/layout: `docs/DESIGN_SYSTEM.md` · All UI strings: `docs/CONTENT_COPY.md`
- Tests + fingerprint vectors: `docs/TEST_PLAN.md` · Deploy: `docs/DEPLOYMENT.md`

When code and a doc disagree, ask; if the doc is wrong, update the doc in the same change.

## Stack

- `web/` — static site (GitHub Pages), vanilla ES modules, no build step. Libraries from CDN at the **pinned versions in ARCHITECTURE §3** (ethers 6.13.4, Tiptap 2.10.3 via esm.sh, marked 15.0.4, turndown 7.2.0, DOMPurify 3.2.3, html2pdf.js 0.10.2, docx 9.1.0). Never use unpinned or `@latest` URLs.
- `worker/` — Cloudflare Worker, TypeScript, `@anthropic-ai/sdk`, `@mozilla/readability` + `linkedom`, KV binding `RL`.
- `contracts/InstantBlog.sol` — Solidity ^0.8.20, compile 0.8.24, EVM `paris`, optimizer 200.

## Commands

```bash
# site (any static server, from repo root)
npx serve web -l 5173
bash scripts/build-pages.sh          # copies index.html → write/ verify/ posts/ 404.html

# worker
cd worker && npx wrangler dev        # needs worker/.dev.vars (gitignored)
cd worker && npx wrangler deploy
cd worker && npx wrangler tail
npx tsc --noEmit -p worker           # typecheck
```

## Rules that must not break

- **Never commit secrets.** `ANTHROPIC_API_KEY` lives only in `wrangler secret` / `worker/.dev.vars`. No keys in `web/`.
- **All chain/site constants live in `web/js/config.js` only** (contract address, chain params, Worker URL, explorer URLs). Don't hard-code them elsewhere.
- **`web/js/fingerprint.js` is frozen after mainnet launch.** Any change to `canonicalText()` must keep the TEST_PLAN §4 vectors passing; otherwise old proofs stop verifying. Stamp and verify must use the same function.
- Only the hash, title (≤160 bytes, cut by bytes), words, tone (0–5), sources (0–5) go on-chain — never article text.
- Tone enum is shared by UI, Worker and contract: 0 Friendly, 1 Professional, 2 Witty, 3 Inspiring, 4 Academic, 5 Casual.
- Model output is HTML-sanitised with DOMPurify before touching the DOM.
- Worker: CORS exact allow-list, SSRF guard on every fetch **and every redirect hop**, rate limits, and **never log article/selection/source text**.
- LLM: model from `env.MODEL` (`claude-opus-5-5`); draft effort `medium`, edit effort `low`; don't send `thinking: {type:"disabled"}` or `budget_tokens` (400 on this model); always handle `stop_reason === "refusal"`.
- Editor content is never lost: snapshot before Generate, AI accepts are one undo step, errors keep content.
- Writing, AI and exports must work without MetaMask; only Stamp needs a wallet. `/verify` never needs one.
- localStorage access always in try/catch; app must work without it.

## Conventions

- Plain ES modules, one module per concern as listed in ARCHITECTURE §2; no frameworks, no bundler for `web/`.
- CSS uses tokens from `web/css/tokens.css`; no raw hex colours in components.
- UI copy comes from `docs/CONTENT_COPY.md` verbatim; add new strings there first.
- Reference requirement IDs in commit messages where useful (e.g. `feat(edit): preview accept/discard (E-4, E-5)`).

## Verifying work

- Run the TEST_PLAN case IDs for the area you touched; for UI changes check 375 px and 1280 px.
- Contract changes: run the CONTRACT_SPEC §8 checklist on testnet (chain 968) before mainnet (677).
- Worker changes: run the curl suite in WORKER_API §8, including the SSRF URLs.
