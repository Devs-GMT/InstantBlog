# InstantBlog — Deployment Runbook

The order matters: **testnet contract → Worker → site preview → mainnet contract → live site.**

---

## 1. Networks

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | 968 (`0x3c8`) | 677 (`0x2a5`) |
| RPC | https://rpc.bohr.life | https://rpc.botchain.ai |
| Explorer | https://scan.bohr.life | https://scan.botchain.ai |
| Currency | BOT (18) | BOT (18) |

> ⚠ The currency symbol `BOT` and its 18 decimals are assumed. Confirm them on botchain.ai docs or the chainlist entry before shipping `wallet_addEthereumChain`. MetaMask warns if the symbol doesn't match what the RPC reports.

---

## 2. Contract (Remix)

1. Open remix.ethereum.org → new file `InstantBlog.sol` → paste `contracts/InstantBlog.sol`.
2. Solidity Compiler: **0.8.24**, *Advanced* → EVM version **paris**, optimizer **on / 200**. Compile.
3. Deploy & Run: *Injected Provider – MetaMask*, check that the chain ID shown is 968 → **Deploy** → confirm.
4. Run the [testnet checklist](CONTRACT_SPEC.md#8-manual-test-checklist-testnet-968). (The same checks already pass on a local Hardhat chain.)
5. Switch MetaMask to **677** → Deploy again → copy the **address**.
6. scan.botchain.ai → contract → **Verify & Publish** → Solidity single file, 0.8.24, MIT, optimizer yes/200, EVM paris → paste the source.
7. Put the address in two places: the GitHub Actions variable `NEXT_PUBLIC_CONTRACT_MAINNET` (or the default in `web/lib/config.ts`) and `README.md`.

---

## 3. Worker (Cloudflare)

```bash
cd worker
npm ci
npx wrangler login
npx wrangler kv namespace create RL           # paste the id into wrangler.toml
npx wrangler secret put ANTHROPIC_API_KEY     # paste key; never commit it
npx wrangler deploy
npx wrangler tail                             # watch logs (should show no article text)
```

- `ALLOWED_ORIGINS` in `wrangler.toml` = the exact production origins (custom domain and/or `https://<org>.github.io`). Remove `http://localhost:5173` for production.
- Local dev: copy `.dev.vars.example` to `.dev.vars`. Add `MOCK_AI=1` to test the whole UI without an API key. **`.dev.vars` is gitignored; `MOCK_AI` must never be set in production.**
- Optional: a custom route `api.instantblog.xyz/*` → Worker (Cloudflare DNS needed).
- Set a **monthly spend limit** in the Anthropic Console as a hard stop on cost.

---

## 4. Site (Next.js static export → GitHub Pages)

The workflow `.github/workflows/pages.yml` builds `web/` (`npm ci && npm run build` → `web/out`) and deploys it on every push to `main` that touches `web/`.

1. Repo → Settings → Pages → Source: **GitHub Actions**.
2. Repo → Settings → Secrets and variables → Actions → **Variables**:
   - `NEXT_PUBLIC_WORKER_URL` = deployed Worker URL
   - `NEXT_PUBLIC_SITE_URL` = `https://instantblog.xyz` (or the github.io URL)
   - `NEXT_PUBLIC_CONTRACT_MAINNET` = mainnet address (and `NEXT_PUBLIC_CONTRACT_TESTNET` / `NEXT_PUBLIC_USE_TESTNET=1` for a testnet preview)
3. Custom domain: `web/public/CNAME` contains `instantblog.xyz`. At the DNS provider, an apex domain gets A records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`. A `www` subdomain gets a CNAME to `<org>.github.io`.
4. Settings → Pages → Custom domain → wait for the DNS check → tick **Enforce HTTPS** (the clipboard API needs HTTPS).
5. **Without a custom domain** (project URL `https://<org>.github.io/InstantBlog/`), set `basePath: "/InstantBlog"` in `next.config.ts` and remove `public/CNAME`, otherwise assets 404.
6. Check that `/write/` and `/verify/?proof=1` load directly (200) and the console shows no CORS or 404 errors.

Local production preview:

```bash
cd web
NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:8787 NEXT_PUBLIC_SITE_URL=http://localhost:5173 npm run build
npx serve out -l 5173
```

---

## 5. Go-live checklist

- [ ] Actions variables set: mainnet contract, Worker URL, site URL (`NEXT_PUBLIC_USE_TESTNET` unset)
- [ ] Footer shows the mainnet address, "✓ Verified on-chain", and the explorer link works
- [ ] Worker `ALLOWED_ORIGINS` = the live origin(s) only; `MOCK_AI` unset
- [ ] 2–3 demo articles stamped on mainnet (how-to, listicle, opinion)
- [ ] `git grep -nI "sk-ant"` → nothing. `.dev.vars` not committed
- [ ] Replace `web/public/botchain-logo.svg` (placeholder) with the official BOT Chain mark
- [ ] README updated (address, live URL)

## 6. Rollback

- **Front end:** revert the commit → Pages redeploys in about 1 min.
- **Worker:** `npx wrangler rollback`.
- **Contract:** it's immutable. If it's broken, deploy a new one and switch the address variable (old proofs stay readable at the old address, so keep it listed in the README).
