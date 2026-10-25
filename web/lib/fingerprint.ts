// Fingerprint v1 — FROZEN after mainnet launch. Test vectors: docs/TEST_PLAN.md §4 (tests/fingerprint.test.mjs).
// `marked` is pinned to 15.0.4 in package.json because parsing changes would change hashes.
import { marked } from "marked";

export const FP_VERSION = 1;

const AI_LINE = /^written with ai assistance\.?$/i;
const MARKER = /^(?:[-*+•·▪◦]|\d+[.)]|#{1,6}|>)\s+/;
const BLOCKS = "h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,tr,br,hr";

export function canonicalText(input: string): string {
  const md = String(input || "")
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "");
  const html = marked.parse(md, { gfm: true, breaks: false, async: false }) as string;
  // DOMParser documents never run scripts or load resources, so no sanitising is needed for textContent.
  const doc = new DOMParser().parseFromString(`<!doctype html><html><body><div>${html}</div></body></html>`, "text/html");
  // A line break after every block so text from different blocks never merges.
  doc.querySelectorAll(BLOCKS).forEach((el) => el.after(doc.createTextNode("\n")));
  return (doc.body.textContent || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .split("\n")
    .map((l) => l.trim().replace(MARKER, "").trim())
    .filter((l) => l && !AI_LINE.test(l))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fingerprint(markdown: string): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalText(markdown));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return "0x" + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Body words only (everything before "## Sources"), without [n] markers. */
export function wordCount(markdown: string): number {
  const body = String(markdown || "").split(/^##\s+Sources\s*$/im)[0];
  const text = canonicalText(body).replace(/\[\d+\]/g, "");
  return text ? text.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
}
