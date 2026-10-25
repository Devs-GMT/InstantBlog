"use client";
import { useEffect, useRef, useState } from "react";
import { CONFIG } from "@/lib/config";
import { copyText, shortAddr } from "@/lib/format";
import { useUI } from "./Providers";
import { useWallet } from "./WalletProvider";

/** Connect / Install MetaMask / Switch to BOT Chain / 0xAB…9f3c menu */
export function WalletButton() {
  const w = useWallet();
  const { toast } = useUI();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!w.ready) return <span className="btn btn-secondary btn-sm wallet-btn" aria-hidden="true" style={{ visibility: "hidden" }}>Connect wallet</span>;
  if (!w.hasProvider)
    return (
      <a className="btn btn-secondary btn-sm wallet-btn" href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
        Install MetaMask
      </a>
    );
  if (!w.address)
    return (
      <button type="button" className="btn btn-secondary btn-sm wallet-btn" onClick={w.connect}>
        Connect wallet
      </button>
    );
  if (!w.onChain)
    return (
      <button type="button" className="btn btn-secondary btn-sm wallet-btn is-wrong" onClick={w.ensureChain}>
        Switch to BOT Chain
      </button>
    );

  const address = w.address;
  return (
    <div className="wallet" ref={ref}>
      <button type="button" className="btn btn-secondary btn-sm wallet-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="dot" />
        <span className="mono">{shortAddr(address)}</span>
      </button>
      {open && (
        <div className="menu" role="menu">
          <button type="button" role="menuitem" onClick={async () => ((await copyText(address)) && toast("Address copied"), setOpen(false))}>
            Copy address
          </button>
          <a role="menuitem" href={CONFIG.explorerAddress(address)} target="_blank" rel="noopener noreferrer">
            View on explorer ↗
          </a>
          <div className="menu-sep" />
          <button type="button" role="menuitem" onClick={() => (w.disconnect(), setOpen(false))}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
