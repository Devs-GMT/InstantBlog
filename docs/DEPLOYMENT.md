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

1. Open remix.ethereum.org → new file `InstantBlog.sol` → paste from [CONTRACT_SPEC § 5](CONTRACT_SPEC.md#5-reference-implementation).
2. Solidity Compiler: **0.8.24**, *Advanced* → EVM version **paris**, optimizer **on / 200**. Compile.
3. Deploy & Run: *Injected Provider – MetaMask*, check that the chain ID shown is 968 → **Deploy** → confirm.
4. Run the [testnet checklist](CONTRACT_SPEC.md#8-manual-test-checklist-testnet-968).
5. Switch MetaMask to **677** → Deploy again → copy the **address** and the **deploy block** (from the tx receipt).
6. scan.botchain.ai → contract → **Verify & Publish** → Solidity single file, 0.8.24, MIT, optimizer yes/200, EVM paris → paste the source.
7. Update the address in exactly 2 places: `web/js/config.js` (`CONTRACT_ADDRESS`, `DEPLOY_BLOCK`) and `README.md`.

---

## 3. Worker (Cloudflare)

```bash
cd worker
npm i @anthropic-ai/sdk @mozilla/readability linkedom
npm i -D wrangler typescript @cloudflare/workers-types
npx wrangler login
npx wrangler kv namespace create RL           # paste the id into wrangler.toml
npx wrangler secret put ANTHROPIC_API_KEY     # paste key; never commit it
npx wrangler deploy
npx wrangler tail                             # watch logs (should show no article text)
```

- `ALLOWED_ORIGINS` in `wrangler.toml` holds the custom domain and the `github.io` URL. For local dev, use `wrangler dev` with a `.dev.vars` file that sets `ALLOWED_ORIGINS=http://localhost:5173`. **`.dev.vars` is gitignored.**
- Optional: a custom route `api.instantblog.xyz/*` → Worker (Cloudflare DNS needed).
- Set a **monthly spend limit** in the Anthropic Console as a hard stop on cost.

`.gitignore`:

```
node_modules/
.wrangler/
.dev.vars
.env*
```

---

## 4. Site (GitHub Pages + custom domain)

```bash
# scripts/build-pages.sh — makes deep links return 200 on Pages
set -euo pipefail
cd web
for p in write verify posts; do mkdir -p "$p"; cp index.html "$p/index.html"; done
cp index.html 404.html
```

1. Repo → Settings → Pages → Source: **GitHub Actions** (or the `gh-pages` branch / the `web` folder via an action).
2. Minimal workflow `.github/workflows/pages.yml`: checkout → run `scripts/build-pages.sh` → `actions/upload-pages-artifact` (path `web`) → `actions/deploy-pages`.
3. `web/CNAME` contains `instantblog.xyz`. At the DNS provider, an apex domain gets A records to `185.199.108.153`, `.109.153`, `.110.153` and `.111.153` (and AAAA if you want IPv6). A `www` subdomain gets a CNAME to `<user>.github.io`.
4. Settings → Pages → Custom domain → wait for the DNS check → tick **Enforce HTTPS**. The clipboard API needs HTTPS.
5. Check that `https://instantblog.xyz/write` returns 200 and that the browser console shows no CORS errors calling the Worker.

---

## 5. Go-live checklist

- [ ] `config.js`: `USE_TESTNET=false`, mainnet `CONTRACT_ADDRESS`, `WORKER_URL`, `SITE_URL`
- [ ] Footer shows the mainnet address and the explorer link works
- [ ] Worker `ALLOWED_ORIGINS` includes the live domain
- [ ] 2–3 demo articles stamped on mainnet (how-to, listicle, opinion)
- [ ] `git grep -nI "sk-ant"` → nothing. `.dev.vars` not committed
- [ ] README updated (address, live URL, Worker URL optional)
- [ ] OG image + favicon load

## 6. Rollback

- **Front end:** revert the commit → Pages redeploys in about 1 min.
- **Worker:** `npx wrangler rollback`.
- **Contract:** it's immutable. If it's broken, deploy a new one and switch `CONTRACT_ADDRESS` (old proofs stay readable at the old address, so keep it listed in the README).
