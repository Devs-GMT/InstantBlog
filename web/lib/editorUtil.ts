// Tiptap helpers: citation decorations, doc structure, ranges for AI panel helpers. PRD D-4, E-7.
import { Extension, type Editor } from "@tiptap/core";
import { DOMSerializer, type Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { cleanHtml, htmlToMd, mdToHtml } from "./markdown";

/* ---------- citations ---------- */

export const citeKey = new PluginKey<DecorationSet>("citations");
const CITE = /\[(\d{1,2})\]/g;

/** Highlights [n] markers; marks them red when n isn't a usable source. */
export function citationExtension(getValid: () => Set<number> | null) {
  const build = (doc: PMNode) => {
    const valid = getValid();
    const decos: Decoration[] = [];
    doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      CITE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = CITE.exec(node.text))) {
        const n = Number(m[1]);
        const bad = valid !== null && !valid.has(n);
        decos.push(
          Decoration.inline(pos + m.index, pos + m.index + m[0].length, {
            class: `cite-mark${bad ? " bad" : ""}`,
            "data-n": String(n),
          }),
        );
      }
    });
    return DecorationSet.create(doc, decos);
  };
  return Extension.create({
    name: "citations",
    addProseMirrorPlugins() {
      return [
        new Plugin<DecorationSet>({
          key: citeKey,
          state: {
            init: (_, { doc }) => build(doc),
            apply: (tr, old) => (tr.docChanged || tr.getMeta(citeKey) ? build(tr.doc) : old.map(tr.mapping, tr.doc)),
          },
          props: { decorations: (state) => citeKey.getState(state) },
        }),
      ];
    },
  });
}

export function refreshCitations(editor: Editor) {
  editor.view.dispatch(editor.state.tr.setMeta(citeKey, true).setMeta("addToHistory", false));
}

/* ---------- content ---------- */

/** Replace the whole document. history:false keeps streaming frames out of the undo stack. */
export function setDocHtml(editor: Editor, html: string, { history = true, emit = true } = {}) {
  editor
    .chain()
    .command(({ tr }) => {
      tr.setMeta("addToHistory", history);
      return true;
    })
    .setContent(cleanHtml(html || ""), { emitUpdate: emit })
    .run();
}

export const setDocMarkdown = (editor: Editor, md: string, opts?: { history?: boolean; emit?: boolean }) =>
  setDocHtml(editor, mdToHtml(md), opts);

export const getMarkdown = (editor: Editor) => htmlToMd(editor.getHTML());

/** Markdown of a range (keeps bold/links/citations). */
export function rangeMarkdown(editor: Editor, from: number, to: number) {
  const slice = editor.state.doc.slice(from, to);
  const div = document.createElement("div");
  div.append(DOMSerializer.fromSchema(editor.schema).serializeFragment(slice.content));
  return htmlToMd(div.innerHTML).trim();
}

/* ---------- structure ---------- */

export type Block = { pos: number; end: number; type: string; level?: number; text: string };

export function blocks(editor: Editor): Block[] {
  const out: Block[] = [];
  editor.state.doc.forEach((node, pos) => {
    out.push({ pos, end: pos + node.nodeSize, type: node.type.name, level: node.attrs?.level, text: node.textContent });
  });
  return out;
}

const isH = (b: Block, level: number, re?: RegExp) => b.type === "heading" && b.level === level && (!re || re.test(b.text.trim()));
const CONCLUSION = /^(conclusion|wrapping up|final thoughts)\b/i;
const SOURCES = /^sources$/i;

export function docTitle(editor: Editor) {
  return blocks(editor).find((b) => isH(b, 1))?.text.trim() ?? "";
}

export function outline(editor: Editor) {
  return blocks(editor)
    .filter((b) => isH(b, 2))
    .map((b) => b.text.trim())
    .filter(Boolean);
}

export type Range = { from: number; to: number };

/** Where Write intro / Write conclusion / Add a section act. to === from means insert. */
export function helperRanges(editor: Editor): { intro: Range; conclusion: Range; section: Range } {
  const bs = blocks(editor);
  const docEnd = editor.state.doc.content.size;
  const h1 = bs.findIndex((b) => isH(b, 1));
  let start = h1 >= 0 ? h1 + 1 : 0;
  // keep the "No sources added" note above the intro
  if (bs[start]?.type === "blockquote" && /no sources added/i.test(bs[start].text)) start++;
  const firstH2 = bs.findIndex((b, i) => i >= start && isH(b, 2));
  const introFrom = bs[start]?.pos ?? (h1 >= 0 ? bs[h1].end : 0);
  const intro = { from: introFrom, to: Math.max(introFrom, firstH2 >= 0 ? bs[firstH2].pos : docEnd) };

  const ci = bs.findIndex((b) => isH(b, 2, CONCLUSION));
  const si = bs.findIndex((b) => isH(b, 2, SOURCES));
  let conclusion: Range;
  if (ci >= 0) {
    const next = bs.findIndex((b, i) => i > ci && isH(b, 2));
    conclusion = { from: bs[ci].pos, to: next >= 0 ? bs[next].pos : docEnd };
  } else {
    const at = si >= 0 ? bs[si].pos : docEnd;
    conclusion = { from: at, to: at };
  }
  const sectionAt = ci >= 0 ? bs[ci].pos : si >= 0 ? bs[si].pos : docEnd;
  return { intro, conclusion, section: { from: sectionAt, to: sectionAt } };
}

/** Replace the first H1's text (title chip swap). Returns the old title. */
export function setTitle(editor: Editor, title: string): string {
  const h1 = blocks(editor).find((b) => isH(b, 1));
  if (!h1) {
    editor.chain().insertContentAt(0, { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: title }] }).run();
    return "";
  }
  if (h1.end - h1.pos <= 2) editor.chain().insertContentAt(h1.pos + 1, title).run();
  else editor.chain().insertContentAt({ from: h1.pos + 1, to: h1.end - 1 }, title).run();
  return h1.text;
}

/** Highlight the Sources-list line for [n] (transient DOM class, cleared on next call). */
export function highlightSourceLine(editor: Editor, n: number | null) {
  const root = editor.view.dom;
  root.querySelectorAll("li.src-hl").forEach((li) => li.classList.remove("src-hl"));
  if (!n) return;
  const heads = [...root.querySelectorAll("h2")];
  const src = heads.find((h) => SOURCES.test(h.textContent?.trim() || ""));
  const list = src?.nextElementSibling;
  if (!list) return;
  [...list.querySelectorAll("li")].find((li) => li.textContent?.trim().startsWith(`[${n}]`))?.classList.add("src-hl");
}
