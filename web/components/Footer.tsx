"use client";
// Receipt footer — PRD §11. Live total() from the contract; address from CONFIG only.
import Link from "next/link";
import { useEffect, useState } from "react";
import { total } from "@/lib/chain";
import { CONFIG, contractConfigured } from "@/lib/config";
import { copyText, fmtNum, shortAddr } from "@/lib/format";
import { Brand } from "./Brand";
import { Icon } from "./Icons";
import { useUI } from "./Providers";
import { Receipt } from "./Receipt";

export function Footer() {
  const { toast } = useUI();
  const [count, setCount] = useState<string>("…");

  useEffect(() => {
    if (!contractConfigured()) return setCount("—");
    total()
      .then((n) => setCount(fmtNum(n)))
      .catch(() => setCount("—"));
  }, []);

  const addr = CONFIG.CONTRACT_ADDRESS;
  return (
    <footer className="footer">
      <div className="container">
        <Receipt
          title="Proof of authorship"
          rows={[
            {
              label: "Network",
              value: (
                <a className="network-link" href={CONFIG.BOTCHAIN_URL} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/botchain-logo.svg" alt="" width={18} height={18} />
                  BOT Chain ↗
                </a>
              ),
            },
            { label: "Chain ID", value: String(CONFIG.CHAIN_ID_NUM) },
            {
              label: "Contract",
              value: (
                <button type="button" className="copyable mono" title={`${addr} — click to copy`} onClick={async () => (await copyText(addr)) && toast("Address copied")}>
                  {shortAddr(addr)} <Icon.copy />
                </button>
              ),
            },
            { label: "Articles stamped", value: <span className="mono">{count}</span> },
          ]}
          total={{ label: "Status", value: contractConfigured() ? "✓ Verified on-chain" : "Deploying soon" }}
        >
          <a className="btn btn-primary btn-block" href={CONFIG.explorerAddress(addr)} target="_blank" rel="noopener noreferrer">
            View on explorer ↗
          </a>
          <div className="receipt-chips">
            <span className="chip chip-blue">Blog</span>
            <span className="chip chip-violet">Article</span>
            <span className="chip chip-pink">PDF</span>
            <span className="chip chip-cyan">Word</span>
          </div>
        </Receipt>

        <div className="footer-grid">
          <div>
            <Brand />
            <p className="built-on">built on BOT Chain</p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><Link href="/write/">Write</Link></li>
              <li><Link href="/verify/">Verify</Link></li>
              <li><Link href="/posts/">My posts</Link></li>
              <li><Link href="/#faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4>Guides</h4>
            <ul>
              <li><Link href="/guides/#how-to">How to write a how-to</Link></li>
              <li><Link href="/guides/#citing">Citing sources</Link></li>
              <li><Link href="/guides/#tone">Choosing a tone</Link></li>
              <li><Link href="/guides/#word">Export to Word</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/about/">About</Link></li>
              <li><a href={CONFIG.GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><Link href="/privacy/">Privacy</Link></li>
              <li><Link href="/terms/">Terms</Link></li>
            </ul>
          </div>
        </div>
        <p className="footer-bottom">© 2026 InstantBlog · AI-assisted writing — always check your facts</p>
      </div>
    </footer>
  );
}
