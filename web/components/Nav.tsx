"use client";
// Dark tab navbar hanging from the top edge (logo · links · white pill CTA).
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";

const LINKS = [
  ["/#how", "How it works"],
  ["/#features", "Features"],
  ["/verify/", "Verify"],
  ["/#faq", "FAQ"],
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  return (
    <header className="navtab-wrap">
      <div className="navtab">
        <Brand light />
        <nav className="navtab-links" aria-label="Main">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/write/" className="navtab-cta">
          Start writing
        </Link>
        <button type="button" className="navtab-burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="navtab-sheet" aria-label="Main">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link href="/posts/" onClick={() => setOpen(false)}>
            My posts
          </Link>
        </nav>
      )}
    </header>
  );
}
