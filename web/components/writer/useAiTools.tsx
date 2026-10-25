"use client";
// AI editing: floating selection toolbar + preview card + panel helpers. PRD E-1…E-7.
import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { editText, type ApiError, type EditAction } from "@/lib/api";
import { usableSources } from "@/lib/brief";
import { TONES } from "@/lib/config";
import { blocks, docTitle, helperRanges, outline, rangeMarkdown } from "@/lib/editorUtil";
import { mdToHtml, mdToInlineHtml } from "@/lib/markdown";
import type { Brief } from "@/lib/store";

type Suggestion = {
  action: EditAction;
  label: string;
  from: number;
  to: number;
  original: string;
  inline: boolean;
  loading: boolean;
  text?: string;
  missing?: number[];
  error?: string;
  top: number;
  tone?: number;
  sectionTopic?: string;
};

const LABELS: Record<EditAction, string> = {
  rewrite: "Rewrite",
  shorten: "Shorten",
  expand: "Expand",
  tone: "Change tone",
  simplify: "Simplify",
  grammar: "Fix grammar",
  intro: "Write intro",
  conclusion: "Write conclusion",
  titles: "Suggest titles",
  section: "Add a section",
};

const SELECTION_ACTIONS: EditAction[] = ["rewrite", "shorten", "expand", "simplify", "grammar"];

/**
 * Tiptap v3 insertContentAt: if the parsed content is only unmarked text, it inserts the ORIGINAL string
 * verbatim (entities/tags stay literal). So pass decoded text when there's no formatting, HTML otherwise.
 */
function inlineContent(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.children.length ? html : el.textContent || "";
}

type Opts = {
  editor: Editor | null;
  brief: Brief;
  disabled: boolean;
  paperRef: React.RefObject<HTMLDivElement | null>;
  onTitles: (titles: string[]) => void;
  toast: (m: string) => void;
};

export function useAiTools({ editor, brief, disabled, paperRef, onTitles, toast }: Opts) {
  const [bubble, setBubble] = useState<{ left: number; top: number } | null>(null);
  const [toneOpen, setToneOpen] = useState(false);
  const [sugg, setSugg] = useState<Suggestion | null>(null);
  const [busyHelper, setBusyHelper] = useState<EditAction | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef(brief);
  briefRef.current = brief;

  /* ---------- floating toolbar position ---------- */
  const place = useCallback(() => {
    if (!editor || disabled || sugg) return setBubble(null);
    const { from, to, empty } = editor.state.selection;
    if (empty || !editor.isFocused) return setBubble(null);
    const words = editor.state.doc.textBetween(from, to, " ").trim().split(/\s+/).filter(Boolean).length;
    if (words < 3) return setBubble(null);
    const a = editor.view.coordsAtPos(from);
    const b = editor.view.coordsAtPos(to);
    const left = Math.min(Math.max((a.left + b.right) / 2, 160), window.innerWidth - 160);
    setBubble({ left, top: Math.max(a.top - 10, 70) });
  }, [editor, disabled, sugg]);

  useEffect(() => {
    if (!editor) return;
    const onBlur = () => setTimeout(() => !bubbleRef.current?.contains(document.activeElement) && setBubble(null), 120);
    editor.on("selectionUpdate", place);
    editor.on("focus", place);
    editor.on("blur", onBlur);
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      editor.off("selectionUpdate", place);
      editor.off("focus", place);
      editor.off("blur", onBlur);
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [editor, place]);

  useEffect(() => setToneOpen(false), [bubble === null]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- request ---------- */
  const topFor = (pos: number) => {
    if (!editor || !paperRef.current) return 0;
    const c = editor.view.coordsAtPos(Math.min(pos, editor.state.doc.content.size));
    return c.bottom - paperRef.current.getBoundingClientRect().top + 10;
  };

  const request = async (action: EditAction, opts: { from: number; to: number; inline: boolean; tone?: number; sectionTopic?: string; selection?: string }) => {
    if (!editor) return;
    const b = briefRef.current;
    const ctx = blocks(editor)
      .filter((x) => x.end > opts.from && x.pos < Math.max(opts.to, opts.from + 1))
      .map((x) => x.text)
      .join("\n\n")
      .slice(0, 8000);
    const original = opts.to > opts.from ? rangeMarkdown(editor, opts.from, opts.to) : "";
    const label = action === "tone" && opts.tone != null ? `Tone · ${TONES[opts.tone]}` : LABELS[action];
    const withSources = action === "expand" || action === "section";

    if (action !== "titles") {
      editor.setEditable(false);
      setSugg({ action, label, from: opts.from, to: opts.to, original, inline: opts.inline, loading: true, top: topFor(opts.to), tone: opts.tone, sectionTopic: opts.sectionTopic });
    }
    setBubble(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await editText(
        {
          action,
          selection: (opts.selection ?? original).slice(0, 6000),
          paragraph: ctx,
          tone: opts.tone,
          sectionTopic: opts.sectionTopic,
          brief: {
            topic: b.topic.trim() || docTitle(editor) || "Untitled article",
            type: b.type,
            tone: b.tone,
            audience: b.audience.trim(),
            points: b.points.map((p) => p.trim()).filter(Boolean),
          },
          outline: outline(editor),
          sources: withSources ? usableSources(b) : [],
        },
        ctrl.signal,
      );
      if (action === "titles") {
        if (res.titles?.length) {
          onTitles(res.titles);
          toast("3 new title ideas");
        }
        return;
      }
      setSugg((s) => (s ? { ...s, loading: false, text: res.text || "", missing: res.missingCitations } : s));
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      const message = (err as ApiError).message || "The AI request failed.";
      if (action === "titles") toast(message);
      else setSugg((s) => (s ? { ...s, loading: false, error: message } : s));
    }
  };

  const runSelection = (action: EditAction, tone?: number) => {
    if (!editor) return;
    const { from, to, $from, $to } = editor.state.selection;
    request(action, { from, to, inline: $from.sameParent($to) && $from.parent.isTextblock, tone });
  };

  const runHelper = async (action: "intro" | "conclusion" | "titles" | "section", sectionTopic?: string) => {
    if (!editor) return;
    const r = helperRanges(editor);
    const range = action === "intro" ? r.intro : action === "conclusion" ? r.conclusion : action === "section" ? r.section : { from: 0, to: 0 };
    setBusyHelper(action);
    try {
      await request(action, { ...range, inline: false, sectionTopic, selection: "" });
    } finally {
      setBusyHelper(null);
    }
  };

  /* ---------- accept / discard ---------- */
  const close = useCallback(() => {
    abortRef.current?.abort();
    setSugg(null);
    editor?.setEditable(true);
  }, [editor]);

  const accept = useCallback(() => {
    if (!editor || !sugg?.text) return;
    const inline = sugg.inline && !/\n\n|^#{1,6}\s|^[-*+]\s|^\d+\.\s|^>/m.test(sugg.text.trim());
    const html = inline ? inlineContent(mdToInlineHtml(sugg.text.trim())) : mdToHtml(sugg.text);
    editor.setEditable(true);
    const chain = editor.chain().focus();
    if (sugg.to > sugg.from) chain.insertContentAt({ from: sugg.from, to: sugg.to }, html).run();
    else chain.insertContentAt(sugg.from, html).run();
    setSugg(null);
  }, [editor, sugg]);

  useEffect(() => {
    if (!sugg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && sugg.text) {
        e.preventDefault();
        accept();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sugg, accept, close]);

  // Alt+/ moves focus into the AI toolbar (keyboard access, DESIGN_SYSTEM §10).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "/" && bubbleRef.current) {
        e.preventDefault();
        bubbleRef.current.querySelector("button")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const bubbleEl = bubble && (
    <div ref={bubbleRef} className="bubble" role="toolbar" aria-label="AI edit" style={{ left: bubble.left, top: bubble.top }} onMouseDown={(e) => e.preventDefault()}>
      {SELECTION_ACTIONS.slice(0, 3).map((a) => (
        <button key={a} type="button" onClick={() => runSelection(a)}>
          {LABELS[a]}
        </button>
      ))}
      <span className="sep" />
      <span style={{ position: "relative" }}>
        <button type="button" aria-expanded={toneOpen} onClick={() => setToneOpen((o) => !o)}>
          Change tone ⌄
        </button>
        {toneOpen && (
          <div className="tone-menu" role="menu">
            {TONES.map((t, i) => (
              <button key={t} type="button" className="chip" role="menuitem" onClick={() => runSelection("tone", i)}>
                {t}
              </button>
            ))}
          </div>
        )}
      </span>
      <span className="sep" />
      {SELECTION_ACTIONS.slice(3).map((a) => (
        <button key={a} type="button" onClick={() => runSelection(a)}>
          {LABELS[a]}
        </button>
      ))}
    </div>
  );

  const cardEl = sugg && (
    <div className="suggest" style={{ top: sugg.top }} role="dialog" aria-label={`Suggestion: ${sugg.label}`}>
      <div className="suggest-head">
        <span>Suggestion · {sugg.label}</span>
        <button type="button" className="icon-btn" aria-label="Close suggestion" onClick={close}>
          ×
        </button>
      </div>
      {sugg.original && <div className="suggest-old">{sugg.original}</div>}
      {sugg.loading && (
        <div className="shimmer" aria-label="Writing…">
          <i />
          <i />
          <i />
        </div>
      )}
      {sugg.error && <div className="banner banner-error">{sugg.error}</div>}
      {sugg.text != null && !sugg.loading && <div className="suggest-new" dangerouslySetInnerHTML={{ __html: mdToHtml(sugg.text) }} />}
      {!!sugg.missing?.length && <p className="suggest-warn">⚠ A citation was removed ({sugg.missing.map((n) => `[${n}]`).join(", ")}) — check before accepting.</p>}
      <div className="suggest-foot">
        <span className="kbd">Esc to discard · Ctrl/⌘ + Enter to accept</span>
        <button type="button" className="btn btn-ghost btn-xs" onClick={close}>
          Discard
        </button>
        {sugg.error ? (
          <button
            type="button"
            className="btn btn-primary btn-xs"
            onClick={() => {
              const s = sugg;
              close();
              setTimeout(() => request(s.action, { from: s.from, to: s.to, inline: s.inline, selection: s.original, tone: s.tone, sectionTopic: s.sectionTopic }), 0);
            }}
          >
            Retry
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-xs" disabled={!sugg.text} onClick={accept} autoFocus>
            Accept
          </button>
        )}
      </div>
    </div>
  );

  return { bubbleEl, cardEl, runHelper, busyHelper, suggestionOpen: !!sugg };
}
