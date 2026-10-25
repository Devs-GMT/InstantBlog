"use client";
// Brief form. PRD B-1…B-8.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { extractUrl, type ApiError } from "@/lib/api";
import { hostOf, isUrl, READ_ERRORS } from "@/lib/brief";
import { CONFIG, LENGTHS, TONES, TYPES } from "@/lib/config";
import type { Brief, BriefSource } from "@/lib/store";

type Props = {
  brief: Brief;
  update: (fn: (b: Brief) => Brief) => void;
  locked: boolean;
  highlight: number | null;
  footer: ReactNode;
};

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function BriefPanel({ brief, update, locked, highlight, footer }: Props) {
  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => update((b) => ({ ...b, [k]: v }));

  return (
    <aside className="card brief" aria-label="Brief">
      <h2>Your brief</h2>
      <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div className="field">
          <label className="label" htmlFor="topic">
            What&apos;s it about?
          </label>
          <input id="topic" className="input" type="text" maxLength={160} autoComplete="off" placeholder="Why small dApps win hackathons" value={brief.topic} onChange={(e) => set("topic", e.target.value)} />
        </div>

        <div className="field">
          <span className="label">Type</span>
          <div className="seg" role="group" aria-label="Type">
            {TYPES.map(([v, l]) => (
              <button key={v} type="button" aria-pressed={brief.type === v} onClick={() => set("type", v)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">Voice tone</span>
          <div className="chips-wrap" role="group" aria-label="Voice tone">
            {TONES.map((t, i) => (
              <button key={t} type="button" className="chip chip-select" aria-pressed={brief.tone === i} onClick={() => set("tone", i)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">Length</span>
          <div className="seg" role="group" aria-label="Length">
            {LENGTHS.map(([v, l, w]) => (
              <button key={v} type="button" aria-pressed={brief.length === v} onClick={() => set("length", v)}>
                {l} <small>{w}</small>
              </button>
            ))}
          </div>
        </div>

        <KeyPoints points={brief.points} onChange={(p) => set("points", p)} />
        <Sources brief={brief} update={update} highlight={highlight} />

        <div className="field">
          <label className="label" htmlFor="audience">
            Audience <span className="helper">optional</span>
          </label>
          <input id="audience" className="input" type="text" maxLength={80} placeholder="beginner developers" value={brief.audience} onChange={(e) => set("audience", e.target.value)} />
        </div>
      </fieldset>
      {footer}
    </aside>
  );
}

/* ---------- key points ---------- */

function KeyPoints({ points, onChange }: { points: string[]; onChange: (p: string[]) => void }) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<{ i: number; after: boolean } | null>(null);
  const focusNext = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusNext.current == null) return;
    listRef.current?.querySelectorAll<HTMLInputElement>("input")[focusNext.current]?.focus();
    focusNext.current = null;
  });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= points.length || from === to) return;
    const next = [...points];
    const [p] = next.splice(from, 1);
    next.splice(to, 0, p);
    onChange(next);
  };

  const n = points.length;
  return (
    <div className="field">
      <span className="label">
        Key points (3–5) <span className="helper">Each becomes a section</span>
      </span>
      <div className="points" ref={listRef}>
        {points.map((p, i) => (
          <div
            key={i}
            className={`point${dragFrom === i ? " dragging" : ""}${dropAt?.i === i ? (dropAt.after ? " drop-after" : " drop-before") : ""}`}
            draggable
            onDragStart={(e) => {
              if ((e.target as HTMLElement).tagName === "INPUT") return e.preventDefault();
              setDragFrom(i);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(i));
            }}
            onDragEnd={() => (setDragFrom(null), setDropAt(null))}
            onDragOver={(e) => {
              if (dragFrom === null) return;
              e.preventDefault();
              const after = e.nativeEvent.offsetY > (e.currentTarget as HTMLElement).offsetHeight / 2;
              setDropAt({ i, after });
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom === null || !dropAt) return;
              let to = dropAt.i + (dropAt.after ? 1 : 0);
              if (dragFrom < to) to--;
              move(dragFrom, to);
              setDragFrom(null);
              setDropAt(null);
            }}
          >
            <span className="handle" title="Drag to reorder" aria-hidden="true">
              ⋮⋮
            </span>
            <span className="num-badge">{i + 1}</span>
            <input
              className="input"
              type="text"
              maxLength={200}
              aria-label={`Key point ${i + 1}`}
              placeholder={i === 0 ? 'Point 1 — e.g. "Small scope is a feature"' : `Point ${i + 1}`}
              value={p}
              onChange={(e) => onChange(points.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && n < 5) {
                  e.preventDefault();
                  const next = [...points];
                  next.splice(i + 1, 0, "");
                  focusNext.current = i + 1;
                  onChange(next);
                }
              }}
            />
            <div className="point-tools">
              <button type="button" className="icon-btn" aria-label={`Move point ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                ↑
              </button>
              <button type="button" className="icon-btn" aria-label={`Move point ${i + 1} down`} disabled={i === n - 1} onClick={() => move(i, i + 1)}>
                ↓
              </button>
              <button type="button" className="icon-btn" aria-label={`Remove point ${i + 1}`} disabled={n <= 3} onClick={() => onChange(points.filter((_, j) => j !== i))}>
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      {n < 5 && (
        <button
          type="button"
          className="add-point"
          onClick={() => {
            focusNext.current = n;
            onChange([...points, ""]);
          }}
        >
          + Add point
        </button>
      )}
    </div>
  );
}

/* ---------- sources ---------- */

function Sources({ brief, update, highlight }: { brief: Brief; update: Props["update"]; highlight: number | null }) {
  const rowsRef = useRef<HTMLDivElement>(null);
  const setSource = (i: number, patch: Partial<BriefSource> | ((s: BriefSource) => Partial<BriefSource>)) =>
    update((b) => ({ ...b, sources: b.sources.map((s, j) => (j === i ? { ...s, ...(typeof patch === "function" ? patch(s) : patch) } : s)) }));

  const read = async (i: number, url: string) => {
    setSource(i, { url, status: "reading", error: undefined });
    try {
      const r = await extractUrl(url);
      update((b) => {
        const s = b.sources[i];
        if (!s || s.url.trim() !== url) return b; // changed while reading
        return { ...b, sources: b.sources.map((x, j) => (j === i ? { ...x, status: "ok", title: r.title, text: r.text, words: r.words, error: undefined } : x)) };
      });
    } catch (err) {
      const e = err as ApiError;
      update((b) => {
        const s = b.sources[i];
        if (!s || s.url.trim() !== url) return b;
        const error = READ_ERRORS[e.reason || ""] || READ_ERRORS[e.code] || e.message || "Couldn't read that page.";
        return { ...b, sources: b.sources.map((x, j) => (j === i ? { ...x, status: "error", text: undefined, error, showPaste: true } : x)) };
      });
    }
  };

  // Sources restored from storage may have lost their text (quota): re-read them once.
  const rereadDone = useRef(false);
  useEffect(() => {
    if (rereadDone.current) return;
    rereadDone.current = true;
    brief.sources.forEach((s, i) => {
      if ((s.status === "reading" || (s.status === "ok" && !s.text)) && isUrl(s.url)) read(i, s.url.trim());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (highlight) rowsRef.current?.querySelector(`[data-n="${highlight}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlight]);

  const maybeRead = (i: number, value: string) => {
    const url = value.trim();
    const s = brief.sources[i];
    if (!url) return setSource(i, { url: "", status: "idle", title: undefined, text: undefined, error: undefined });
    if (!isUrl(url)) return setSource(i, { status: "error", error: READ_ERRORS.bad_url, showPaste: true });
    if (s && (s.status === "ok" || s.status === "reading") && s.url.trim() === url) return;
    read(i, url);
  };

  return (
    <div className="field">
      <span className="label">
        Sources (up to 5) <span className="helper">Facts come from these</span>
      </span>
      <div className="sources" ref={rowsRef}>
        {brief.sources.map((s, i) => {
          const showPaste = s.showPaste || s.status === "error" || !!s.pasted;
          return (
            <div key={i} className={`source-row${highlight === i + 1 ? " hl" : ""}`} data-n={i + 1}>
              <div className="source-line">
                <span className="num-badge" title={`Cited as [${i + 1}]`}>
                  {i + 1}
                </span>
                <input
                  className="input"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  aria-label={`Source ${i + 1} link`}
                  value={s.url}
                  onChange={(e) => setSource(i, { url: e.target.value })}
                  onBlur={(e) => maybeRead(i, e.target.value)}
                  onPaste={(e) => {
                    const v = e.clipboardData.getData("text");
                    if (isUrl(v)) setTimeout(() => maybeRead(i, v), 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      maybeRead(i, (e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <button type="button" className="icon-btn" aria-label={`Remove source ${i + 1}`} onClick={() => update((b) => ({ ...b, sources: b.sources.filter((_, j) => j !== i) }))}>
                  ×
                </button>
              </div>
              <div className="source-status" aria-live="polite">
                {s.status === "reading" && (
                  <span className="chip chip-panel">
                    <span className="spinner" /> Reading…
                  </span>
                )}
                {s.status === "ok" && (
                  <span className="chip chip-green" title={s.title}>
                    ✓ Read · {truncate(s.title || hostOf(s.url), 28)}
                  </span>
                )}
                {s.status === "error" && (
                  <>
                    <span className="chip chip-red" title={s.error}>
                      ✗ Couldn&apos;t read
                    </span>
                    <span className="helper">{s.error}</span>
                  </>
                )}
                {!!s.pasted?.trim() && <span className="chip chip-green">✓ Pasted text</span>}
              </div>
              <button type="button" className="add-point" style={{ fontSize: 12.5, padding: 0 }} onClick={() => setSource(i, { showPaste: !showPaste })}>
                {showPaste ? "Hide pasted text" : "Paste the text instead"}
              </button>
              {showPaste && (
                <textarea
                  className="textarea"
                  aria-label={`Pasted text for source ${i + 1}`}
                  placeholder={`Paste the article text here (up to ${CONFIG.LIMITS.pasteWords.toLocaleString()} words)`}
                  value={s.pasted || ""}
                  onChange={(e) => {
                    const words = e.target.value.split(/\s+/);
                    const value = words.length > CONFIG.LIMITS.pasteWords ? words.slice(0, CONFIG.LIMITS.pasteWords).join(" ") : e.target.value;
                    setSource(i, (cur) => ({ pasted: value, title: cur.title || "Pasted source" }));
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      {brief.sources.length < CONFIG.LIMITS.sources && (
        <button type="button" className="add-point" onClick={() => update((b) => ({ ...b, sources: [...b.sources, { url: "", status: "idle" }] }))}>
          + Add source
        </button>
      )}
    </div>
  );
}
