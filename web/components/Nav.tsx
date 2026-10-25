"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";
import { WalletButton } from "./WalletButton";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="container nav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Main">
          <Link href="/#how">How it works</Link>
          <Link href="/#features">Features</Link>
          <Link href="/#proof">Proof</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <div className="nav-actions">
          <Link href="/verify/" className="btn btn-ghost btn-sm hide-sm">
            Verify
          </Link>
          <WalletButton />
          <Link href="/write/" className="btn btn-primary btn-sm hide-sm">
            Write my first post
          </Link>
        </div>
      </div>
    </header>
  );
}
