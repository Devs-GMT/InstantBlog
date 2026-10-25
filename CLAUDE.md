# CLAUDE.md — InstantBlog

AI blog/article writer: brief (topic, type, tone, length, 3–5 key points, 0–5 source URLs) → Worker reads sources → Gemini streams a cited Markdown draft → AI edits on selected text (preview + Accept/Discard) → Copy / PDF / .docx → stamp a SHA-256 fingerprint on BOT Chain → anyone verifies a copy at `/verify`.

## Where things are specified

Read the relevant doc before building a part; the docs are the source of truth.

- Requirements + IDs (W-, B-, D-, E-, X-, P-, V-, M-): `docs/PRD.md`
- Phase order, checkpoints, cut lines: `docs/BUILD_PLAN.md`
- Repo layout, libs, data model, fingerprint, config: `docs/ARCHITECTURE.md`
- Contract + ABI + compiler settings: `docs/CONTRACT_SPEC.md` (deploy: `docs/DEPLOYMENT.md` §2, Foundry)
- Worker routes, SSE protocol, SSRF guard, LLM config: `docs/WORKER_API.md`
- Prompts: `docs/AI_PROMPTS.md` · UI tokens/layout: `docs/DESIGN_SYSTEM.md` · All UI strings: `docs/CONTENT_COPY.md`
- Tests + fingerprint vectors: `docs/TEST_PLAN.md` · Deploy: `docs/DEPLOYMENT.md`

When code and a doc disagree, ask; if the doc is wrong, update the doc in the same change.

## Stack

- `web/` — **Next.js 16 (App Router) static export** (`output: "export"`, `trailingSlash: true`) deployed on **Vercel** from `origin/main` (Root Directory `web`). React 19, TypeScript, Tiptap v3, ethers v6, marked, turndown, DOMPurify, html2pdf.js, docx — all from npm at the exact versions in `web/package.json`. Plain CSS with design tokens (no Tailwind).
- `worker/` — Cloudflare Worker, TypeScript, Gemini REST API via `fetch` (no SDK), `@mozilla/readability` + `linkedom`, KV binding `RL`.
- `contracts/` — Foundry project (`src/InstantBlog.sol`), Solidity ^0.8.20, compile 0.8.24, EVM `paris`, optimizer 200.
- `tests/` — Node test runner; fingerprint vectors run against `web/lib/fingerprint.ts`.

## Commands

```bash
# web (from web/)
npm run dev                          # http://localhost:5173, talks to the local Worker
npm run build                        # next build + scripts/flatten-rsc.mjs → out/
npm run typecheck

# worker (from worker/)
npx wrangler dev --port 8787         # needs worker/.dev.vars (gitignored); MOCK_AI=1 = canned AI, no key needed
npx wrangler deploy
npx tsc --noEmit

# tests (from tests/)
node --test
```

## Rules that must not break

- **Never commit secrets.** `GEMINI_API_KEY` lives only in `wrangler secret` / `worker/.dev.vars`. No keys in `web/`.
- **All chain/site constants live in `web/lib/config.ts` only** (contract address, chain params, Worker URL, explorer URLs; overridable via `NEXT_PUBLIC_*` build env). Don't hard-code them elsewhere.
- **`web/lib/fingerprint.ts` is frozen after mainnet launch**, and so is the `marked` version (pinned exactly). Any change must keep `tests/fingerprint.test.mjs` passing; otherwise old proofs stop verifying. Stamp and verify use the same function.
- Only the hash, title (≤160 bytes, cut by bytes), words, tone (0–5), sources (0–5) go on-chain — never article text.
- Tone enum is shared by UI, Worker and contract: 0 Friendly, 1 Professional, 2 Witty, 3 Inspiring, 4 Academic, 5 Casual.
- ethers v6: read the Proof tuple **by index** (`r[6]` for `at`) — `Result.at` is `Array.prototype.at`.
- Model output is sanitised with DOMPurify before touching the DOM. Tiptap v3 `insertContentAt` inserts the raw string verbatim when it parses to plain unmarked text, so pass decoded text in that case and HTML only when it has formatting (see `inlineContent()` in `useAiTools.tsx`).
- Worker: CORS exact allow-list, SSRF guard on every fetch **and every redirect hop**, rate limits, and **never log article/selection/source text**. `MOCK_AI` must never be set in production.
- LLM: Google Gemini (free tier), model from `env.MODEL` (default `gemini-2.5-flash`), called from `worker/src/gemini.ts`. Drop `thought` parts; map finish reasons (SAFETY etc. → `refusal`, MAX_TOKENS → `max_tokens`); `maxOutputTokens` includes thinking tokens. Free-tier data may be used by Google — keep the Privacy page honest about it.
- Editor content is never lost: snapshot before Generate, AI accepts are one undo step, errors keep content.
- Writing, AI and exports must work without MetaMask; only Stamp needs a wallet. `/verify` never needs one.
- localStorage access always in try/catch; app must work without it.
- Static export only: no API routes, no server actions, no `next/image` optimisation, no middleware. Anything using `window` lives in client components (the writer loads with `ssr: false`).

## Conventions

- `web/lib/` = framework-free logic (testable); `web/components/` = React UI; one concern per file as in ARCHITECTURE §2.
- CSS uses tokens from `web/app/styles/tokens.css`; no raw hex colours in components.
- UI copy comes from `docs/CONTENT_COPY.md` verbatim; add new strings there first.
- Commit at each milestone with a descriptive message. **No Claude co-author / attribution lines in commits or PRs.**
- Avoid `\uXXXX` escapes in files written by tools — they can be turned into invisible raw characters; check with grep afterwards.

## Verifying work

- `npm run typecheck` + `npm run build` in `web/`; `node --test` in `tests/`.
- Run the TEST_PLAN case IDs for the area you touched; for UI changes check 375 px and 1280 px.
- Contract changes: `forge test` in `contracts/`, then deploy to testnet (968) before mainnet (677).
- Worker changes: run the curl suite in WORKER_API §8, including the SSRF URLs.
