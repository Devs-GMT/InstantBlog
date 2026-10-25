// Markdown <-> HTML for the editor and exports. Client-only at call time (DOMPurify/Turndown need a DOM).
import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";

const sanitize = (html: string) => (DOMPurify.isSupported ? DOMPurify.sanitize(html, { ADD_ATTR: ["target", "rel"] }) : html);

export function mdToHtml(md: string): string {
  return sanitize(marked.parse(String(md || "").replace(/<!--[\s\S]*?-->/g, ""), { gfm: true, breaks: false, async: false }) as string);
}

export function mdToInlineHtml(md: string): string {
  return sanitize(marked.parseInline(String(md || ""), { gfm: true, async: false }) as string);
}

export const cleanHtml = sanitize;

let td: TurndownService | null = null;
function turndown(): TurndownService {
  if (td) return td;
  td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced", emDelimiter: "*", hr: "---" });
  // Light escaping: keep [1] citations readable; only escape what would change the structure.
  td.escape = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/([*_`])/g, "\\$1")
      .replace(/^(#{1,6}\s)/gm, "\\$1")
      .replace(/^([-+]\s)/gm, "\\$1")
      .replace(/^(>)/gm, "\\$1")
      .replace(/^(\d+)\.(\s)/gm, "$1\\.$2");
  td.addRule("listItem", {
    filter: "li",
    replacement(content, node, options) {
      const body = content.replace(/^\n+/, "").replace(/\n+$/, "\n").replace(/\n(?!$)/gm, "\n   ");
      let prefix = `${options.bulletListMarker} `;
      const parent = node.parentNode as HTMLElement | null;
      if (parent?.nodeName === "OL") {
        const start = Number(parent.getAttribute("start") || 1);
        prefix = `${start + Array.prototype.indexOf.call(parent.children, node)}. `;
      }
      return prefix + body + (node.nextSibling && !/\n$/.test(body) ? "\n" : "");
    },
  });
  return td;
}

export const htmlToMd = (html: string) => turndown().turndown(html || "").trim() + "\n";

/** Pull "<!-- titles: A | B | C -->" out of streamed Markdown. */
export function extractTitles(md: string): { md: string; titles: string[] } {
  const m = /<!--\s*titles:\s*([\s\S]*?)-->/i.exec(md);
  if (!m) return { md, titles: [] };
  const titles = m[1]
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);
  return { md: md.replace(m[0], ""), titles };
}

/** Citation numbers used in the body, and Sources-list entries that name an unknown source. */
export function badCitations(md: string, valid: Set<number>): number[] {
  const used = new Set([...md.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])));
  return [...used].filter((n) => !valid.has(n)).sort((a, b) => a - b);
}
