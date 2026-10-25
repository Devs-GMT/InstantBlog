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

## 2. Contract (Foundry)

`contracts/` is a Foundry project (`foundry.toml`: solc 0.8.24, EVM **paris**, optimizer 200; RPC aliases `botchain` and `botchain_testnet`). `forge-std` is a git submodule — after cloning run `git submodule update --init`.

```bash
cd contracts
forge test                                   # 7 tests incl. fuzz — mirrors CONTRACT_SPEC §8

# Burner deployer: key lives ONLY in contracts/.env (gitignored), never printed or committed
#   DEPLOYER_ADDRESS=0x…   PRIVATE_KEY=0x…
cast balance $DEPLOYER_ADDRESS --rpc-url botchain_testnet --ether

# Dry run (no tx) → shows gas + BOT needed (~836k gas ≈ 0.017 BOT at 20 gwei)
forge script script/Deploy.s.sol --rpc-url botchain_testnet

# Deploy (forge loads PRIVATE_KEY from contracts/.env)
forge script script/Deploy.s.sol --rpc-url botchain_testnet --broadcast    # testnet 968 first
forge script script/Deploy.s.sol --rpc-url botchain --broadcast            # then mainnet 677
```

1. Fund the burner address with a little BOT on the target network (≈ 0.05 BOT covers the deploy + a few demo stamps).
2. Deploy to testnet, then smoke-test with `cast`: `cast send <addr> "stamp(bytes32,string,uint32,uint8,uint8)" 0x…01 "Hello" 100 0 0 --rpc-url botchain_testnet --private-key $PRIVATE_KEY`, then `cast call <addr> "total()(uint256)"`.
3. Deploy to mainnet. The address is printed and saved in `broadcast/Deploy.s.sol/677/run-latest.json` (safe to commit — public tx data).
4. Verify the source on scan.botchain.ai → contract → **Verify & Publish** → Solidity single file, 0.8.24, MIT, optimizer yes/200, EVM paris (or `forge verify-contract` if the explorer exposes a Blockscout/Etherscan-compatible API).
5. Put the address in the Vercel env var `NEXT_PUBLIC_CONTRACT_MAINNET` (testnet: `NEXT_PUBLIC_CONTRACT_TESTNET`) and in `README.md`.

> The burner wallet is only a deployer. It has no special rights in the contract (there is no owner/admin), so it can be discarded after deploying.

---

## 3. Worker (Cloudflare)

```bash
cd worker
npm ci
npx wrangler login
npx wrangler kv namespace create RL           # paste the id into wrangler.toml
npx wrangler secret put GEMINI_API_KEY        # free key from https://aistudio.google.com/apikey; never commit it
npx wrangler deploy
npx wrangler tail                             # watch logs (should show no article text)
```

- `ALLOWED_ORIGINS` in `wrangler.toml` = the production origin(s). Default: `https://instantblog.vercel.app,https://instantblog-*.vercel.app` (the `*` entry matches one label fragment, which covers Vercel preview URLs such as `instantblog-git-main-devs-gmt.vercel.app`). Update it if the Vercel project name or a custom domain differs. Remove `http://localhost:5173` for production.
- Local dev: copy `.dev.vars.example` to `.dev.vars`. Add `MOCK_AI=1` to test the whole UI without an API key. **`.dev.vars` is gitignored; `MOCK_AI` must never be set in production.**
- Optional: a custom route `api.instantblog.xyz/*` → Worker (Cloudflare DNS needed).
- Gemini free tier: no billing needed. Its quota is per Google Cloud project; if you later enable billing, set a budget alert in Google Cloud.

---

## 4. Site (Next.js → Vercel, from `origin/main`)

The web app deploys to **Vercel** from the GitHub repo `Devs-GMT/InstantBlog`, branch `main`. Every push to `main` makes a production deployment; other branches/PRs get preview URLs. `web/vercel.json` pins the framework (`nextjs`), `npm ci` and `npm run build` (which includes the `flatten-rsc` post-step for the static export).

1. vercel.com → **Add New… → Project → Import Git Repository** → `Devs-GMT/InstantBlog`.
2. **Root Directory: `web`** (important — the repo is a monorepo). Framework preset: Next.js (auto). Production branch: `main`.
3. **Environment Variables** (Production, and Preview if wanted):
   - `NEXT_PUBLIC_WORKER_URL` = deployed Worker URL
   - `NEXT_PUBLIC_CONTRACT_MAINNET` = mainnet address
   - Optional: `NEXT_PUBLIC_SITE_URL` (defaults to the Vercel production domain via `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`), `NEXT_PUBLIC_USE_TESTNET=1` (+ `NEXT_PUBLIC_CONTRACT_TESTNET`) for a testnet preview — the testnet address `0x4625…F72a` is already the default.
4. Deploy. `NEXT_PUBLIC_*` values are inlined at build time, so **redeploy after changing them**.
5. Make sure the Worker's `ALLOWED_ORIGINS` contains the production domain (and the preview pattern) — see §3.
6. Custom domain (optional): Vercel → Project → Settings → Domains → add the domain and follow the DNS instructions; then add that origin to `ALLOWED_ORIGINS`.
7. Check that `/write/` and `/verify/?proof=1` load directly (200) and the console shows no CORS or 404 errors.

CLI alternative (needs `vercel login`): `cd web && npx vercel link` (pick the project) → `npx vercel --prod`.

Local production preview:

```bash
cd web
NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:8787 NEXT_PUBLIC_SITE_URL=http://localhost:5173 npm run build
npx serve out -l 5173
```

---

## 5. Go-live checklist

- [ ] Vercel env vars set: mainnet contract, Worker URL (`NEXT_PUBLIC_USE_TESTNET` unset in Production) — then redeploy
- [ ] Footer shows the mainnet address, "✓ Verified on-chain", and the explorer link works
- [ ] Worker `ALLOWED_ORIGINS` = the live origin(s) only; `MOCK_AI` unset
- [ ] 2–3 demo articles stamped on mainnet (how-to, listicle, opinion)
- [ ] `git grep -nI "AIza"` → nothing (Gemini keys start with AIza). `.dev.vars` not committed
- [ ] Replace `web/public/botchain-logo.svg` (placeholder) with the official BOT Chain mark
- [ ] README updated (address, live URL)

## 6. Rollback

- **Front end:** Vercel → Deployments → pick the previous production deployment → **Promote to Production** (instant), or revert the commit on `main`.
- **Worker:** `npx wrangler rollback`.
- **Contract:** it's immutable. If it's broken, deploy a new one and switch the address variable (old proofs stay readable at the old address, so keep it listed in the README).
