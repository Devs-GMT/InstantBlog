"use client";
// Copy · PDF · .docx (top bar) and the mobile Export tab list. PRD X-1…X-7.
import type { Editor } from "@tiptap/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { copyText, fmtDate, shortAddr } from "@/lib/format";
import { docTitle } from "@/lib/editorUtil";
import { copyRich, downloadDocx, downloadPdf, markdownExport, plainExport } from "@/lib/exporters";
import type { Prefs } from "@/lib/store";
import { useUI } from "../Providers";
import { useWallet } from "../WalletProvider";

export function useExports(editor: Editor | null, prefs: Prefs, fallbackTitle: string) {
  const { toast } = useUI();
  const wallet = useWallet();
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);

  const ready = () => {
    if (!editor || editor.isEmpty) {
      toast("Nothing to export yet.");
      return null;
    }
    return editor;
  };
  const title = () => (editor ? docTitle(editor) : "") || fallbackTitle || "Article";
  const byline = () => `By ${prefs.authorName.trim() || shortAddr(wallet.address) || "Author"} · ${fmtDate(Date.now())}`;
  const opts = () => ({ aiLabel: prefs.aiLabel, title: title(), byline: byline() });

  return {
    busy,
    copyRich: async () => {
      const ed = ready();
      if (!ed) return;
      toast((await copyRich(ed.getHTML(), opts())) ? "Copied — paste into Docs, Notion or Medium" : "Couldn't copy. Try Markdown instead.");
    },
    copyMarkdown: async () => {
      const ed = ready();
      if (!ed) return;
      toast((await copyText(markdownExport(ed.getHTML(), opts()))) ? "Markdown copied" : "Couldn't copy.");
    },
    copyPlain: async () => {
      const ed = ready();
      if (!ed) return;
      toast((await copyText(plainExport(ed.getHTML(), opts()))) ? "Plain text copied" : "Couldn't copy.");
    },
    pdf: async () => {
      const ed = ready();
      if (!ed) return;
      setBusy("pdf");
      const r = await downloadPdf(ed.getHTML(), opts());
      setBusy(null);
      if (r === "print") toast('PDF tools didn\'t load — opening print instead. Choose "Save as PDF".', 4000);
    },
    docx: async () => {
      const ed = ready();
      if (!ed) return;
      setBusy("docx");
      const r = await downloadDocx(ed.getJSON(), ed.getHTML(), opts());
      setBusy(null);
      if (r === "md") toast("Word export didn't load — downloaded Markdown instead.", 4000);
    },
  };
}

type Ex = ReturnType<typeof useExports>;

export function ExportButtons({ ex, prefs, setPrefs }: { ex: Ex; prefs: Prefs; setPrefs: (p: Partial<Prefs>) => void }) {
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

  const pick = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  return (
    <div className="export-btns">
      <div className="drop" ref={ref}>
        <button type="button" className="btn btn-secondary btn-sm" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          Copy <ChevronDown size={15} />
        </button>
        {open && (
          <div className="menu" role="menu" style={{ left: 0, right: "auto", minWidth: 260 }}>
            <button type="button" role="menuitem" onClick={pick(ex.copyRich)}>
              <span>
                Rich text <span className="muted">— for Docs, Notion, Medium</span>
              </span>
            </button>
            <button type="button" role="menuitem" onClick={pick(ex.copyMarkdown)}>
              Markdown
            </button>
            <button type="button" role="menuitem" onClick={pick(ex.copyPlain)}>
              Plain text
            </button>
            <div className="menu-sep" />
            <label>
              <input type="checkbox" checked={prefs.aiLabel} onChange={(e) => setPrefs({ aiLabel: e.target.checked })} /> Add &quot;Written with AI assistance&quot;
            </label>
          </div>
        )}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={ex.pdf} disabled={ex.busy === "pdf"}>
        {ex.busy === "pdf" ? <span className="spinner" /> : null} PDF
      </button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={ex.docx} disabled={ex.busy === "docx"}>
        {ex.busy === "docx" ? <span className="spinner" /> : null} .docx
      </button>
    </div>
  );
}

export function ExportPanel({ ex, prefs, setPrefs, stamp }: { ex: Ex; prefs: Prefs; setPrefs: (p: Partial<Prefs>) => void; stamp: React.ReactNode }) {
  return (
    <div className="card export-panel" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Export</h2>
      <div className="export-list">
        <button type="button" className="btn btn-secondary" onClick={ex.copyRich}>
          Copy rich text
        </button>
        <button type="button" className="btn btn-secondary" onClick={ex.copyMarkdown}>
          Copy Markdown
        </button>
        <button type="button" className="btn btn-secondary" onClick={ex.copyPlain}>
          Copy plain text
        </button>
        <button type="button" className="btn btn-secondary" onClick={ex.pdf} disabled={ex.busy === "pdf"}>
          Download PDF
        </button>
        <button type="button" className="btn btn-secondary" onClick={ex.docx} disabled={ex.busy === "docx"}>
          Download Word (.docx)
        </button>
      </div>
      <div className="field" style={{ marginTop: 20 }}>
        <label className="label" htmlFor="author-name">
          Author name <span className="helper">for the PDF byline · stays in this browser</span>
        </label>
        <input id="author-name" className="input" maxLength={60} placeholder="Your name" value={prefs.authorName} onChange={(e) => setPrefs({ authorName: e.target.value })} />
      </div>
      <label className="label" style={{ marginTop: 16, gap: 10, justifyContent: "flex-start", fontWeight: 500 }}>
        <input type="checkbox" checked={prefs.aiLabel} onChange={(e) => setPrefs({ aiLabel: e.target.checked })} /> Add &quot;Written with AI assistance&quot; to exports
      </label>
      <div style={{ marginTop: 20 }}>{stamp}</div>
    </div>
  );
}
