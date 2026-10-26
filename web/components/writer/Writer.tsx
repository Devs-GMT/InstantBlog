"use client";
// /write — brief → streamed draft → AI edits → export → stamp. Orchestrates the writer screen (PRD §5, §7).
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ArrowRight, Sparkles, Square, Stamp as StampIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { streamDraft, type ApiError } from "@/lib/api";
import { draftPayload, skippedCount, usableSources, validate } from "@/lib/brief";
import { CONFIG } from "@/lib/config";
import { citationExtension, docTitle, getMarkdown, highlightSourceLine, refreshCitations, setDocHtml, setDocMarkdown, setTitle } from "@/lib/editorUtil";
import { fingerprint, wordCount } from "@/lib/fingerprint";
import { fmtNum, readingTime } from "@/lib/format";
import { badCitations, extractTitles } from "@/lib/markdown";
import { newDraft, store, type Brief, type Draft, type Prefs } from "@/lib/store";
import { LogoMark } from "../Brand";
import { ProofCard } from "../ProofCard";
import { useUI } from "../Providers";
import { WalletButton } from "../WalletButton";
import { BriefPanel } from "./BriefPanel";
import { ExportButtons, ExportPanel, useExports } from "./Exports";
import { Toolbar } from "./Toolbar";
import { useAiTools } from "./useAiTools";
import { useStamp } from "./useStamp";

type Tab = "brief" | "draft" | "export";

function loadInitialDraft(): Draft {
  const q = new URLSearchParams(window.location.search);
  if (q.has("new")) return newDraft();
  const id = q.get("id") || store.currentId();
  return (id && store.getDraft(id)) || newDraft();
}

export default function Writer() {
  const { toast, ask } = useUI();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [prefs, setPrefsState] = useState<Prefs>(() => store.prefs());
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [words, setWords] = useState(0);
  const [hash, setHash] = useState<string | null>(null);
  const [hl, setHl] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("brief");
  const [sectionTopic, setSectionTopic] = useState<string | null>(null);
  const [helpersOpen, setHelpersOpen] = useState(false);

  const draftRef = useRef<Draft | null>(null);
  draftRef.current = draft;
  const validRef = useRef<Set<number> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingRef = useRef(false);
  const warnedStorage = useRef(false);

  const setPrefs = (p: Partial<Prefs>) => {
    store.setPrefs(p);
    setPrefsState((cur) => ({ ...cur, ...p }));
  };

  /* ---------- persistence ---------- */
  const saveNow = useCallback((ed = editorRef.current) => {
    const d = draftRef.current;
    if (!d || !ed) return;
    const next: Draft = { ...d, html: ed.getHTML(), title: docTitle(ed), words: wordCount(getMarkdown(ed)), updatedAt: Date.now() };
    const ok = store.saveDraft(next);
    store.setCurrent(next.id);
    if (!ok && !warnedStorage.current) {
      warnedStorage.current = true;
      toast("Couldn't save in this browser — export to keep your work.", 4000);
    }
  }, [toast]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNow(), 800);
  }, [saveNow]);

  const recount = useCallback(() => {
    if (countTimer.current) clearTimeout(countTimer.current);
    countTimer.current = setTimeout(async () => {
      const ed = editorRef.current;
      if (!ed || streamingRef.current) return;
      const md = getMarkdown(ed);
      setWords(wordCount(md));
      setHash(ed.isEmpty ? null : await fingerprint(md));
    }, 150);
  }, []);

  /* ---------- editor ---------- */
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
      }),
      Placeholder.configure({ placeholder: "Your draft will appear here. Fill in the brief and hit Generate — or just start typing." }),
      citationExtension(() => validRef.current),
    ],
    editorProps: { attributes: { "aria-label": "Article editor", spellcheck: "true" } },
    onUpdate: () => {
      if (streamingRef.current) return;
      recount();
      scheduleSave();
    },
  });
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Load the current draft once the editor exists.
  useEffect(() => {
    if (!editor || draftRef.current) return;
    const d = loadInitialDraft();
    setDraft(d);
    store.setCurrent(d.id);
    setDocHtml(editor, d.html, { history: false, emit: false });
    if (d.words > 0 || /[\p{L}\p{N}]/u.test(d.html.replace(/<[^>]*>/g, ""))) setTab("draft");
    recount();
  }, [editor, recount]);

  // Citation validity follows the usable sources.
  const usable = useMemo(() => (draft ? usableSources(draft.brief) : []), [draft]);
  useEffect(() => {
    validRef.current = new Set(usable.map((s) => s.n));
    if (editor) refreshCitations(editor);
  }, [usable, editor]);

  // Save brief edits too.
  useEffect(() => {
    if (draft) scheduleSave();
  }, [draft, scheduleSave]);

  // Flush on tab close.
  useEffect(() => {
    const flush = () => saveNow();
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [saveNow]);

  useEffect(() => {
    if (!helpersOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setHelpersOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [helpersOpen]);

  const updateBrief = useCallback((fn: (b: Brief) => Brief) => setDraft((d) => (d ? { ...d, brief: fn(d.brief) } : d)), []);

  /* ---------- generate ---------- */
  const generate = async () => {
    const ed = editor;
    const d = draftRef.current;
    if (!ed || !d) return;
    if (!validate(d.brief).ok) return;
    if (!ed.isEmpty) {
      const ok = await ask({
        title: "Replace current draft?",
        text: "Your current version stays in Undo and My posts.",
        actions: [
          { label: "Cancel", value: false },
          { label: "Replace", value: true, primary: true },
        ],
      });
      if (!ok) return;
    }
    const payload = draftPayload(d.brief);
    validRef.current = new Set(payload.sources.map((s) => s.n));
    const snapshot = ed.getHTML();
    let buf = "";
    let frame: ReturnType<typeof setTimeout> | null = null;
    let doneInfo: { stop: string } | null = null;

    setError(null);
    setWarning(null);
    setStreaming(true);
    streamingRef.current = true;
    ed.setEditable(false);
    setTab("draft");
    setStatus(payload.sources.length ? "Reading your sources…" : "Writing…");
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const render = () => {
      frame = null;
      const { md } = extractTitles(buf);
      setDocMarkdown(ed, md, { history: false, emit: false });
      const sections = (md.match(/^##\s/gm) || []).length;
      const total = payload.points.length + 1;
      if (sections) setStatus(`Writing section ${Math.min(sections, total)} of ${total}…`);
    };

    const finish = (stopped: boolean, failed?: string) => {
      if (frame) clearTimeout(frame);
      streamingRef.current = false;
      setStreaming(false);
      setStatus("");
      ed.setEditable(true);
      const { md, titles } = extractTitles(buf);
      // Put the snapshot back without history, then apply the result as ONE undoable step.
      setDocHtml(ed, snapshot, { history: false, emit: false });
      if (md.trim()) {
        setDocMarkdown(ed, md, { history: true, emit: true });
        if (titles.length) setDraft((cur) => (cur ? { ...cur, altTitles: titles } : cur));
      }
      if (failed) setError(failed);
      else if (stopped) toast("Stopped. Your partial draft is kept.");
      else if (doneInfo?.stop === "max_tokens") setWarning("The draft was cut off before the end. You can write the rest or regenerate.");
      else if (doneInfo?.stop === "refusal") setError("The AI couldn't write this one. Try rephrasing the topic.");
      const bad = badCitations(md.split(/^##\s+Sources\s*$/im)[0], validRef.current ?? new Set());
      if (md.trim() && bad.length) setWarning(`⚠ This draft cites a source that doesn't exist: ${bad.map((n) => `[${n}]`).join(", ")}. Check it before publishing.`);
      recount();
      saveNow(ed);
    };

    try {
      await streamDraft(payload, {
        onDelta: (t) => {
          buf += t;
          if (!frame) frame = setTimeout(render, 120);
        },
        onDone: (info) => (doneInfo = info),
        signal: ctrl.signal,
      });
      finish(false);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") finish(true);
      else finish(false, `Couldn't finish the draft — ${(err as ApiError).message || "something went wrong."}`);
    }
  };

  const stop = () => abortRef.current?.abort();

  /* ---------- AI tools, exports, stamp ---------- */
  const ai = useAiTools({
    editor,
    brief: draft?.brief ?? newDraft().brief,
    disabled: streaming,
    paperRef,
    onTitles: (titles) => setDraft((d) => (d ? { ...d, altTitles: titles } : d)),
    toast,
  });
  const ex = useExports(editor, prefs, draft?.brief.topic ?? "");
  const st = useStamp({
    editor,
    draft,
    onStamped: (s) => setDraft((d) => (d ? { ...d, stamps: [...d.stamps, s] } : d)),
  });

  const lastStamp = draft?.stamps.at(-1);
  const edited = !!lastStamp && !!hash && hash !== lastStamp.hash;
  const v = draft ? validate(draft.brief) : { ok: false, hint: "" };
  const skipped = draft ? skippedCount(draft.brief) : 0;
  const empty = !editor || editor.isEmpty;

  const stampLabel =
    st.phase === "connect"
      ? "Connecting…"
      : st.phase === "wallet"
        ? "Confirm in MetaMask…"
        : st.phase === "pending"
          ? "Stamping…"
          : st.phase === "done" && lastStamp
            ? `✓ Stamped #${lastStamp.proofId}`
            : edited
              ? "Stamp new version"
              : "Stamp on BOT Chain";

  const stampControl = (
    <div className="stamp-wrap">
      {edited && st.phase === "idle" && <span className="chip chip-amber hide-sm">Edited since stamp</span>}
      {st.phase === "pending" && st.txHash && (
        <a className="helper" href={CONFIG.explorerTx(st.txHash)} target="_blank" rel="noopener noreferrer">
          view tx ↗
        </a>
      )}
      <button
        type="button"
        className={`btn btn-sm ${st.phase === "done" ? "btn-success" : "btn-primary"}`}
        onClick={st.run}
        disabled={streaming || empty || st.phase === "wallet" || st.phase === "pending" || st.phase === "connect"}
        title={empty ? "Write or generate an article first" : undefined}
      >
        {(st.phase === "pending" || st.phase === "wallet" || st.phase === "connect") && <span className="spinner" />}
        <span className="stamp-label-long">{stampLabel}</span>
        <span className="stamp-label-short">{st.phase === "idle" ? "Stamp" : stampLabel}</span>
      </button>
    </div>
  );


  const runHelper = (a: "intro" | "conclusion" | "titles" | "section", topic?: string) => {
    setHelpersOpen(false);
    setTab("draft");
    ai.runHelper(a, topic);
  };

  const helpersPanel = (
    <div className="helpers">
      <h3>
        <Sparkles size={16} strokeWidth={2} /> AI helpers
      </h3>
      <div className="chips-wrap">
        {(
          [
            ["intro", "Write intro"],
            ["conclusion", "Write conclusion"],
            ["titles", "Suggest titles"],
          ] as const
        ).map(([a, l]) => (
          <button key={a} type="button" className="btn btn-secondary" disabled={streaming || empty || !!ai.busyHelper || ai.suggestionOpen} onClick={() => runHelper(a)}>
            {ai.busyHelper === a && <span className="spinner" />} {l}
          </button>
        ))}
        <button type="button" className="btn btn-secondary" disabled={streaming || empty || ai.suggestionOpen} onClick={() => setSectionTopic((t) => (t === null ? "" : null))}>
          Add a section for…
        </button>
      </div>
      {sectionTopic !== null && (
        <form
          className="section-input"
          onSubmit={(e) => {
            e.preventDefault();
            if (sectionTopic.trim().length < 2) return;
            runHelper("section", sectionTopic.trim());
            setSectionTopic(null);
          }}
        >
          <input className="input" autoFocus maxLength={160} placeholder="Add a section about…" value={sectionTopic} onChange={(e) => setSectionTopic(e.target.value)} aria-label="Section topic" />
          <button type="submit" className="btn btn-primary btn-sm">
            Write it
          </button>
        </form>
      )}
    </div>
  );

  /* ---------- citation hover ---------- */
  const onPaperOver = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest?.(".cite-mark") as HTMLElement | null;
    const n = el ? Number(el.dataset.n) : null;
    if (n !== hl) {
      setHl(n);
      if (editor) highlightSourceLine(editor, n);
    }
  };

  const swapTitle = (t: string) => {
    if (!editor) return;
    const old = setTitle(editor, t);
    setDraft((d) => (d ? { ...d, altTitles: d.altTitles.map((x) => (x === t ? old : x)).filter(Boolean) } : d));
  };

  if (!draft) return <div className="page muted">Loading the writer…</div>;

  const versions = draft.stamps.map((s) => s.proofId);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="InstantBlog home">
          <LogoMark />
          <span>InstantBlog</span>
        </Link>
        <div className="doc-meta">
          <span className="doc-title" title={draft.title || draft.brief.topic}>
            {(editor && docTitle(editor)) || draft.brief.topic || "Untitled draft"}
          </span>
          <span className="counters" aria-live="polite">
            {fmtNum(words)} words · {readingTime(words, CONFIG.READING_WPM)} min read
          </span>
        </div>
        <div className="topbar-actions">
          <ExportButtons ex={ex} prefs={prefs} setPrefs={setPrefs} />
          {stampControl}
          <span className="hide-sm">
            <WalletButton />
          </span>
        </div>
        <button type="button" className="icon-btn topbar-stamp-sm" aria-label="Export and stamp" title="Export and stamp" disabled={empty || streaming} onClick={() => setTab("export")}>
          <StampIcon size={18} strokeWidth={2} />
        </button>
      </header>

      <div className="mtabs">
        <div className="seg" role="tablist" aria-label="Writer sections">
          {(["brief", "draft", "export"] as Tab[]).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <main className="writer" data-tab={tab}>
        <BriefPanel
          brief={draft.brief}
          update={updateBrief}
          locked={streaming}
          highlight={hl}
          footer={
            <>
              <div className="gen-wrap">
                {streaming ? (
                  <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={stop}>
                    Stop
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary btn-lg btn-block" disabled={!v.ok} onClick={generate}>
                    Generate draft →
                  </button>
                )}
                <p className="gen-hint" aria-live="polite">
                  {streaming ? status : v.hint}
                </p>
                {!streaming && skipped > 0 && (
                  <p className="warn-line">
                    {skipped} source{skipped > 1 ? "s" : ""} couldn&apos;t be read and will be skipped.
                  </p>
                )}
              </div>
              <div className="helpers-desktop">{helpersPanel}</div>
            </>
          }
        />

        <section className="editor-col" aria-label="Draft">
          {draft.altTitles.length > 0 && (
            <div className="title-chips">
              <span className="label-sm">Title ideas:</span>
              {draft.altTitles.map((t) => (
                <button key={t} type="button" className="chip chip-violet" title="Use this title" onClick={() => swapTitle(t)}>
                  {t}
                </button>
              ))}
            </div>
          )}
          {streaming && (
            <div className="status-line" aria-live="polite">
              <span className="spinner" /> {status}
              <button type="button" className="btn btn-ghost btn-xs" onClick={stop}>
                Stop
              </button>
            </div>
          )}
          {error && (
            <div className="banner banner-error" role="alert">
              <span>{error}</span>
              <button type="button" className="btn btn-xs btn-secondary" onClick={() => (setError(null), generate())}>
                Retry
              </button>
            </div>
          )}
          {warning && (
            <div className="banner banner-warn" role="status">
              <span>{warning}</span>
              <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setWarning(null)}>
                ×
              </button>
            </div>
          )}
          {editor && <Toolbar editor={editor} serif={prefs.serif} onSerif={() => setPrefs({ serif: !prefs.serif })} />}
          <div
            ref={paperRef}
            className={`paper${prefs.serif ? " serif" : ""}${streaming ? " streaming" : ""}`}
            onMouseOver={onPaperOver}
            onMouseLeave={() => {
              setHl(null);
              if (editor) highlightSourceLine(editor, null);
            }}
          >
            <EditorContent editor={editor} />
            {ai.cardEl}
          </div>
        </section>

        <ExportPanel
          ex={ex}
          prefs={prefs}
          setPrefs={setPrefs}
          stamp={
            <div className="export-wallet">
              <span className="label">Wallet</span>
              <WalletButton />
            </div>
          }
        />
      </main>

      <div className="mbar" data-tab={tab}>
        {tab === "brief" &&
          (streaming ? (
            <button type="button" className="btn btn-secondary btn-block" onClick={stop}>
              <Square size={15} strokeWidth={2.4} /> Stop
            </button>
          ) : (
            <>
              {(v.hint || skipped > 0) && <p className="mbar-hint">{v.hint || `${skipped} source${skipped > 1 ? "s" : ""} will be skipped`}</p>}
              <button type="button" className="btn btn-primary btn-block" disabled={!v.ok} onClick={generate}>
                Generate draft <ArrowRight size={17} strokeWidth={2.2} />
              </button>
            </>
          ))}
        {tab === "draft" &&
          (streaming ? (
            <button type="button" className="btn btn-secondary btn-block" onClick={stop}>
              <Square size={15} strokeWidth={2.4} /> Stop
            </button>
          ) : (
            <div className="mbar-row">
              <button type="button" className="btn btn-secondary" disabled={empty} onClick={() => setHelpersOpen(true)}>
                <Sparkles size={16} strokeWidth={2} /> AI helpers
              </button>
              <button type="button" className="btn btn-primary" disabled={empty} onClick={() => setTab("export")}>
                Export <ArrowRight size={17} strokeWidth={2.2} />
              </button>
            </div>
          ))}
        {tab === "export" && <div className="mbar-stamp">{stampControl}</div>}
      </div>

      {helpersOpen && (
        <div className="msheet-backdrop" onClick={() => setHelpersOpen(false)}>
          <div className="msheet" role="dialog" aria-modal="true" aria-label="AI helpers" onClick={(e) => e.stopPropagation()}>
            <span className="msheet-grip" aria-hidden="true" />
            {helpersPanel}
          </div>
        </div>
      )}

      {ai.bubbleEl}
      {st.card && (
        <div className="proof-pop" role="dialog" aria-label="Proof of authorship">
          <ProofCard proof={st.card.proof} txHash={st.card.txHash} versions={versions} onClose={st.closeCard} />
        </div>
      )}
    </>
  );
}
