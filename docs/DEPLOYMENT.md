# InstantBlog — Deployment Runbook

The order matters: **testnet contract → Vercel preview → mainnet contract → production.** The site and its API are one Next.js app on Vercel; the only other moving part is the contract.

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

## 3. API (inside the Next.js app)

There is no separate backend to deploy: `/api/extract-url`, `/api/blog/draft` and `/api/blog/edit` are route handlers in `web/app/api/` and ship with every Vercel deployment.

- Local: `cp web/.env.example web/.env.local`, set `GEMINI_API_KEY` (free key: https://aistudio.google.com/apikey) or `MOCK_AI=1`, then `pnpm dev` (http://localhost:3000).
- Production: set the same server env vars in Vercel (§4). `MOCK_AI` must stay unset.
- Gemini free tier: no billing needed; quota is per Google Cloud project. If you enable billing later, set a budget alert in Google Cloud.
- Optional shared rate limits: create a free Upstash Redis database (Vercel Marketplace → Upstash) and set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. Without them, limits are counted per serverless instance.

---

## 4. Site + API (Next.js → Vercel, from `origin/main`)

Every push to `main` makes a production deployment; other branches/PRs get preview URLs. `web/vercel.json` pins the framework (`nextjs`), `pnpm install --frozen-lockfile` and `pnpm build`; `package.json` pins `packageManager: pnpm@11.24.0`.

1. vercel.com → **Add New… → Project → Import Git Repository** → `Devs-GMT/InstantBlog`.
2. **Root Directory: `web`** (the repo also holds `contracts/`, `docs/`, `tests/`). Framework preset: Next.js (auto). Production branch: `main`.
3. **Environment Variables** (Production, and Preview if wanted):
   - `GEMINI_API_KEY` = your AI Studio key (**server-only, never `NEXT_PUBLIC_`**)
   - `GEMINI_MODEL` = `gemini-3.6-flash` (optional; that is the default)
   - `NEXT_PUBLIC_CONTRACT_MAINNET` = mainnet address once deployed (unset = the app runs on the testnet contract `0x4625…F72a`)
   - Optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `LIMIT_DRAFT`, `LIMIT_EDIT`, `LIMIT_EXTRACT`, `NEXT_PUBLIC_SITE_URL` (defaults to the Vercel production domain)
4. Deploy. `NEXT_PUBLIC_*` values are inlined at build time, so **redeploy after changing them**; server vars also apply from the next deployment.
5. Check `https://<domain>/api/health/` → `{"ok":true,"ai":"gemini"}` (`"missing-key"` means `GEMINI_API_KEY` isn't set).
6. Check that `/write/` and `/verify/?proof=1` load and a draft streams.
7. Vercel Hobby limits are fine for this app: drafts take about 12 s (route `maxDuration` is 60 s).

CLI alternative (needs `vercel login`): `cd web && npx vercel link` (pick the project) → `npx vercel --prod`.

Local production preview:

```bash
cd web
pnpm build && pnpm start           # reads web/.env.local; http://localhost:3000 (pages + /api)
MOCK_AI=1 pnpm start               # same, with canned AI output (no Gemini calls)
```

---

## 5. Go-live checklist

- [ ] Vercel env vars set: `GEMINI_API_KEY`, mainnet contract (`NEXT_PUBLIC_USE_TESTNET` unset in Production), then redeploy
- [ ] Footer shows the mainnet address, "✓ Verified on-chain", and the explorer link works
- [ ] `/api/health/` says `"ai":"gemini"`; `MOCK_AI` unset
- [ ] 2–3 demo articles stamped on mainnet (how-to, listicle, opinion)
- [ ] `git grep -nI "AIza"` → nothing (Gemini keys start with AIza). `.dev.vars` not committed
- [ ] Replace `web/public/botchain-logo.svg` (placeholder) with the official BOT Chain mark
- [ ] README updated (address, live URL)

## 6. Rollback

- **Front end:** Vercel → Deployments → pick the previous production deployment → **Promote to Production** (instant), or revert the commit on `main`.
- **Contract:** it's immutable. If it's broken, deploy a new one and switch the address variable (old proofs stay readable at the old address, so keep it listed in the README).
