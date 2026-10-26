"use client";
// Navbar: a dark tab hanging from the top edge (concave corners join it to the edge). Once the page scrolls
// it detaches into a floating pill. On mobile the bar keeps only logo + menu; every CTA lives in the sheet.
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brand } from "./Brand";
import { WalletButton } from "./WalletButton";

const LINKS = [
  ["/#how", "How it works"],
  ["/#features", "Features"],
  ["/verify/", "Verify"],
  ["/#faq", "FAQ"],
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const [floating, setFloating] = useState(false);
  const wrapRef = useRef<HTMLElement>(null);

  // Detach after a little scroll; hysteresis keeps it from flickering at the threshold.
  useEffect(() => {
    const on = () => setFloating((f) => (f ? window.scrollY > 8 : window.scrollY > 32));
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => !wrapRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <header ref={wrapRef} className="navtab-wrap" data-floating={floating || open ? "true" : "false"}>
      <div className="navtab">
        <span className="navtab-ear navtab-ear--left" aria-hidden="true" />
        <span className="navtab-ear navtab-ear--right" aria-hidden="true" />
        <Brand light />
        <nav className="navtab-links" aria-label="Main">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="navtab-wallet">
          <WalletButton />
        </div>
        <Link href="/write/" className="navtab-cta">
          Start writing
        </Link>
        <button type="button" className="navtab-burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="nav-sheet" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <nav id="nav-sheet" className={`navtab-sheet${open ? " is-open" : ""}`} aria-label="Main" hidden={!open}>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
        <Link href="/posts/" onClick={() => setOpen(false)}>
          My posts
        </Link>
        <div className="navtab-sheet-actions">
          <Link href="/write/" className="navtab-sheet-cta" onClick={() => setOpen(false)}>
            Start writing
          </Link>
          <div className="navtab-sheet-wallet">
            <WalletButton />
          </div>
        </div>
      </nav>
    </header>
  );
}
