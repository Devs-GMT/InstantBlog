import Link from "next/link";

/** Notebook mark: spiral-bound page with ruled lines and a pen stroke. `light` for dark backgrounds. */
export function LogoMark({ className = "brand-mark", light = false }: { className?: string; light?: boolean }) {
  const page = light ? "#FFFFFF" : "#0D111B";
  const ink = light ? "#0D111B" : "#FFFFFF";
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="7" y="3" width="21" height="26" rx="5" fill={page} />
      <path d="M12 11.5h10M12 16h10M12 20.5h6" stroke={ink} strokeWidth="1.8" strokeLinecap="round" opacity=".9" />
      <path d="M4 8.5h5M4 14h5M4 19.5h5M4 25h5" stroke="#1AB4D7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="m20.5 24.2 4.6-4.6 1.6 1.6-4.6 4.6-2.2.6.6-2.2Z" fill="#1AB4D7" />
    </svg>
  );
}

export function Brand({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`brand${light ? " brand-light" : ""}`} aria-label="InstantBlog home">
      <LogoMark light={light} />
      <span>InstantBlog</span>
    </Link>
  );
}
