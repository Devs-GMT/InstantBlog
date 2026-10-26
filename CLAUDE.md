# CLAUDE.md — InstantBlog

AI blog/article writer: brief (topic, type, tone, length, 3–5 key points, 0–5 source URLs) → the API reads the sources → Google Gemini streams a cited Markdown draft → AI edits on selected text (preview + Accept/Discard) → Copy / PDF / .docx → stamp a SHA-256 fingerprint on BOT Chain → anyone verifies a copy at `/verify`.

## Where things are specified

Read the relevant doc before building a part; the docs are the source of truth.

- Requirements + IDs (W-, B-, D-, E-, X-, P-, V-, M-): `docs/PRD.md`
- Repo layout, libs, data model, fingerprint, config: `docs/ARCHITECTURE.md`
- API routes, SSE protocol, SSRF guard, rate limits, Gemini config: `docs/API.md`
- Contract + ABI + compiler settings: `docs/CONTRACT_SPEC.md` · Deploy (Foundry, Vercel): `docs/DEPLOYMENT.md`
- Prompts: `docs/AI_PROMPTS.md` · UI tokens/layout: `docs/DESIGN_SYSTEM.md` · All UI strings: `docs/CONTENT_COPY.md`
- Tests + fingerprint vectors: `docs/TEST_PLAN.md`

When code and a doc disagree, ask; if the doc is wrong, update the doc in the same change.

## Stack (monolith: one Next.js app on Vercel)

- `web/` — **Next.js 16 App Router on Vercel** (project Root Directory `web`, deployed from `origin/main`). Pages + API route handlers in one app. React 19, TypeScript, Tiptap v3, ethers v6, marked, turndown, DOMPurify, html2pdf.js, docx, lucide-react — exact versions in `web/package.json`. Plain CSS with design tokens (no Tailwind).
  - `web/app/api/*/route.ts` — `/api/extract-url`, `/api/blog/draft` (SSE), `/api/blog/edit`, `/api/health` (Node runtime).
  - `web/server/` — server-only logic: Gemini REST client, prompts, validation, SSRF guard + `safeFetch` (undici, IP check at connect time), Readability extraction, rate limits (Upstash Redis or in-memory), dev mock.
  - `web/lib/` — client-side, framework-free logic (config, fingerprint, chain, api client, store, exporters).
- `contracts/` — Foundry project (`src/InstantBlog.sol`), Solidity ^0.8.20, compile 0.8.24, EVM `paris`, optimizer 200.
- `tests/` — Node test runner; fingerprint vectors run against `web/lib/fingerprint.ts`.

## Commands

```bash
# web (from web/) — pnpm only; needs web/.env.local (copy .env.example; GEMINI_API_KEY or MOCK_AI=1)
pnpm install
pnpm dev                             # http://localhost:3000 (pages + /api) — the user runs this themselves
pnpm build && pnpm start             # production build + server on :3000
pnpm typecheck

# contracts (from contracts/)
forge test
forge script script/Deploy.s.sol --rpc-url botchain_testnet --broadcast   # PRIVATE_KEY in contracts/.env

# tests (from tests/)
pnpm install && node --test
```

## Rules that must not break

- **Never commit secrets.** `GEMINI_API_KEY` lives only in `web/.env.local` (gitignored) and Vercel env vars; the deployer key only in `contracts/.env`. Nothing secret under `NEXT_PUBLIC_*`, and never import `web/server/*` from client components.
- **All chain/site constants live in `web/lib/config.ts` only** (contract address, chain params, explorer URLs; overridable via `NEXT_PUBLIC_*` build env). Server config lives in `web/server/env.ts`.
- **`web/lib/fingerprint.ts` is frozen after mainnet launch**, and so is the `marked` version (pinned exactly). Any change must keep `tests/fingerprint.test.mjs` passing; otherwise old proofs stop verifying. The landing sample (`web/components/home/sample.ts`) is stamped as testnet proof #2 — don't edit its text.
- Only the hash, title (≤160 bytes, cut by bytes), words, tone (0–5), sources (0–5) go on-chain — never article text.
- Tone enum is shared by UI, API and contract: 0 Friendly, 1 Professional, 2 Witty, 3 Inspiring, 4 Academic, 5 Casual.
- ethers v6: read the Proof tuple **by index** (`r[6]` for `at`) — `Result.at` is `Array.prototype.at`.
- Model output is sanitised with DOMPurify before touching the DOM. Tiptap v3 `insertContentAt` inserts the raw string verbatim when it parses to plain unmarked text, so pass decoded text in that case and HTML only when it has formatting (see `inlineContent()` in `useAiTools.tsx`).
- API: same-origin only (`assertSameOrigin`), SSRF guard on the URL **and** the resolved IP of every hop (`safeFetch`), per-IP rate limits, **never log article/selection/source text**. `MOCK_AI` must never be set in production. Streams must swallow `enqueue()` errors after a client disconnect (an unhandled rejection kills the Node server).
- LLM: Google Gemini (free tier), model from `GEMINI_MODEL` (default `gemini-3.6-flash`; `gemini-2.5-flash` is closed to new users). Gemini 3: `thinkingLevel: "low"`, no temperature override. Drop `thought` parts; map finish reasons (SAFETY etc. → `refusal`, MAX_TOKENS → `max_tokens`). Free-tier data may be used by Google — keep the Privacy page honest about it.
- Editor content is never lost: snapshot before Generate, AI accepts are one undo step, errors keep content.
- Writing, AI and exports must work without MetaMask; only Stamp needs a wallet. `/verify` never needs one.
- localStorage access always in try/catch; app must work without it.

## Conventions

- `web/lib/` = client logic, `web/server/` = server logic, `web/components/` = React UI; one concern per file.
- CSS uses tokens from `web/app/styles/tokens.css`; no raw hex colours in components.
- UI copy comes from `docs/CONTENT_COPY.md` (including its anti-slop rules); add new strings there first.
- **pnpm only** (`packageManager: pnpm@11.24.0`); never commit a `package-lock.json`. Vercel installs with `pnpm install --frozen-lockfile`.
- **Don't start `pnpm dev` / `pnpm start` in the background** — the user runs the app in their own terminal on port 3000. Builds, typechecks and tests are fine.
- Commit at each milestone with a descriptive message. **No Claude co-author / attribution lines in commits or PRs.**
- Avoid `\uXXXX` escapes in files written by tools — they can be turned into invisible raw characters; check with grep afterwards.

## Verifying work

- `pnpm typecheck` + `pnpm build` in `web/`; `node --test` in `tests/`; `forge test` in `contracts/`.
- Run the TEST_PLAN case IDs for the area you touched; for UI changes check 375 px and 1280 px.
- API changes: run the curl suite in `docs/API.md` §8, including the SSRF URLs, against the user's running server (`pnpm start` / `pnpm dev`, :3000).
