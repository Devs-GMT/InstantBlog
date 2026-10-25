// Exports run fully in the browser. PRD X-1…X-6.
import type { JSONContent } from "@tiptap/core";
import { download, slugify } from "./format";
import { htmlToMd } from "./markdown";

export const AI_LINE = "Written with AI assistance";

export type ExportOpts = { aiLabel: boolean; title: string; byline: string };

/** Article HTML for clipboard/PDF, with the optional AI footer line. */
export function articleHtml(editorHtml: string, { aiLabel }: Pick<ExportOpts, "aiLabel">) {
  return editorHtml + (aiLabel ? `<p class="ai-line"><em>${AI_LINE}</em></p>` : "");
}

/** Plain text that /verify accepts: "- " bullets, "1. " numbers, blank line between blocks. */
export function htmlToPlain(html: string): string {
  const root = new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, "text/html").body;
  const lines: string[] = [];
  const text = (el: Element) => (el.textContent || "").replace(/\s+/g, " ").trim();
  const list = (el: Element, depth: number) => {
    [...el.children].forEach((li, i) => {
      const own = [...li.childNodes]
        .filter((c) => !(c instanceof Element && (c.tagName === "UL" || c.tagName === "OL")))
        .map((c) => c.textContent || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      lines.push(`${"  ".repeat(depth)}${el.tagName === "OL" ? `${i + 1}.` : "-"} ${own}`);
      li.querySelectorAll(":scope > ul, :scope > ol").forEach((sub) => list(sub, depth + 1));
    });
  };
  for (const el of [...root.children]) {
    const tag = el.tagName;
    if (tag === "UL" || tag === "OL") list(el, 0);
    else if (tag === "PRE") lines.push(el.textContent || "");
    else if (tag === "HR") lines.push("---");
    else if (tag === "BLOCKQUOTE") [...el.children].forEach((c) => lines.push(text(c)));
    else lines.push(text(el));
    lines.push("");
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export async function copyRich(editorHtml: string, opts: Pick<ExportOpts, "aiLabel">) {
  const html = articleHtml(editorHtml, opts);
  const plain = htmlToPlain(html);
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([plain], { type: "text/plain" }) }),
    ]);
    return true;
  } catch {
    // Fallback: select a rendered copy and use execCommand.
    const holder = document.createElement("div");
    holder.contentEditable = "true";
    holder.style.cssText = "position:fixed;left:-9999px;top:0;white-space:normal";
    holder.innerHTML = html;
    document.body.append(holder);
    const range = document.createRange();
    range.selectNodeContents(holder);
    const sel = getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    sel?.removeAllRanges();
    holder.remove();
    return ok;
  }
}

export const markdownExport = (editorHtml: string, opts: Pick<ExportOpts, "aiLabel">) =>
  htmlToMd(editorHtml) + (opts.aiLabel ? `\n*${AI_LINE}*\n` : "");

export const plainExport = (editorHtml: string, opts: Pick<ExportOpts, "aiLabel">) => htmlToPlain(articleHtml(editorHtml, opts));

/* ---------- PDF ---------- */

function printArticle(editorHtml: string, opts: ExportOpts) {
  const wrap = document.createElement("article");
  wrap.className = "print-article";
  const tmp = document.createElement("div");
  tmp.innerHTML = articleHtml(editorHtml, opts);
  const h1 = tmp.querySelector("h1");
  const byline = document.createElement("p");
  byline.className = "byline";
  byline.textContent = opts.byline;
  if (h1) h1.after(byline);
  else tmp.prepend(byline);
  wrap.append(...tmp.childNodes);
  return wrap;
}

type Html2Pdf = () => { set: (o: object) => { from: (el: HTMLElement) => { save: () => Promise<void> } } };

/** Returns "pdf" when a file was downloaded, "print" when it fell back to the print dialog. */
export async function downloadPdf(editorHtml: string, opts: ExportOpts): Promise<"pdf" | "print"> {
  const el = printArticle(editorHtml, opts);
  try {
    const mod = (await import("html2pdf.js")) as unknown as { default: Html2Pdf };
    await mod
      .default()
      .set({
        margin: [16, 20, 16, 20],
        filename: `${slugify(opts.title)}.pdf`,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], avoid: ["h2", "h3", "li", "blockquote"] },
      })
      .from(el)
      .save();
    return "pdf";
  } catch (err) {
    console.warn("html2pdf failed, falling back to print:", err);
    const root = document.createElement("div");
    root.id = "print-root";
    root.append(el);
    document.body.append(root);
    const cleanup = () => {
      root.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 60_000);
    return "print";
  }
}

/* ---------- Word ---------- */

/** Returns "docx" on success, "md" when the docx library failed and Markdown was downloaded instead. */
export async function downloadDocx(json: JSONContent, editorHtml: string, opts: ExportOpts): Promise<"docx" | "md"> {
  const name = slugify(opts.title);
  try {
    const d = await import("docx");
    let olInstance = 0;

    type Run = InstanceType<typeof d.TextRun> | InstanceType<typeof d.ExternalHyperlink>;
    const runs = (nodes: JSONContent[] = [], extra: { italics?: boolean } = {}): Run[] =>
      nodes.flatMap((n): Run[] => {
        if (n.type === "hardBreak") return [new d.TextRun({ text: "", break: 1 })];
        if (n.type !== "text" || !n.text) return [];
        const marks = Object.fromEntries((n.marks || []).map((m) => [m.type, m]));
        const base = {
          text: n.text,
          bold: !!marks.bold,
          italics: !!marks.italic || !!extra.italics,
          strike: !!marks.strike,
          underline: marks.underline ? {} : undefined,
          font: marks.code ? "Consolas" : undefined,
        };
        const href = marks.link?.attrs?.href as string | undefined;
        if (href) return [new d.ExternalHyperlink({ link: href, children: [new d.TextRun({ ...base, style: "Hyperlink" })] })];
        return [new d.TextRun(base)];
      });

    const out: InstanceType<typeof d.Paragraph>[] = [];
    const HEADINGS = [d.HeadingLevel.HEADING_1, d.HeadingLevel.HEADING_2, d.HeadingLevel.HEADING_3];

    const walk = (nodes: JSONContent[] = [], ctx: { level: number; quote?: boolean; list?: "bullet" | "ol"; instance?: number } = { level: 0 }) => {
      for (const n of nodes) {
        switch (n.type) {
          case "heading":
            out.push(new d.Paragraph({ heading: HEADINGS[Math.min(3, Number(n.attrs?.level || 1)) - 1], children: runs(n.content) }));
            break;
          case "paragraph": {
            const children = runs(n.content, { italics: ctx.quote });
            if (ctx.list === "bullet") out.push(new d.Paragraph({ children, bullet: { level: ctx.level } }));
            else if (ctx.list === "ol") out.push(new d.Paragraph({ children, numbering: { reference: "ol", level: ctx.level, instance: ctx.instance } }));
            else if (ctx.quote) out.push(new d.Paragraph({ children, indent: { left: 720 }, spacing: { after: 160 } }));
            else out.push(new d.Paragraph({ children, spacing: { after: 160 } }));
            break;
          }
          case "bulletList":
          case "orderedList": {
            const list = n.type === "bulletList" ? "bullet" : "ol";
            const instance = list === "ol" ? ++olInstance : undefined;
            const nested = ctx.list ? ctx.level + 1 : 0;
            for (const li of n.content || []) walk(li.content, { level: nested, list, instance, quote: ctx.quote });
            break;
          }
          case "blockquote":
            walk(n.content, { ...ctx, quote: true });
            break;
          case "codeBlock":
            out.push(new d.Paragraph({ children: [new d.TextRun({ text: (n.content || []).map((c) => c.text || "").join(""), font: "Consolas" })] }));
            break;
          case "horizontalRule":
            out.push(new d.Paragraph({ border: { bottom: { style: d.BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 } } }));
            break;
          default:
            if (n.content) walk(n.content, ctx);
        }
      }
    };
    walk(json.content);
    if (opts.aiLabel) out.push(new d.Paragraph({ spacing: { before: 360 }, children: [new d.TextRun({ text: AI_LINE, italics: true, color: "888888", size: 18 })] }));

    const doc = new d.Document({
      creator: "InstantBlog",
      title: opts.title,
      numbering: {
        config: [
          {
            reference: "ol",
            levels: [0, 1, 2].map((level) => ({
              level,
              format: d.LevelFormat.DECIMAL,
              text: `%${level + 1}.`,
              alignment: d.AlignmentType.START,
              style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
            })),
          },
        ],
      },
      sections: [{ children: out }],
    });
    download(await d.Packer.toBlob(doc), `${name}.docx`);
    return "docx";
  } catch (err) {
    console.warn("docx failed, downloading Markdown instead:", err);
    download(new Blob([markdownExport(editorHtml, opts)], { type: "text/markdown" }), `${name}.md`);
    return "md";
  }
}
