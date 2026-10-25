// localStorage wrapper: every access in try/catch, in-memory fallback. PRD M-1…M-4.
import type { DocType, Length } from "./config";

export type SourceStatus = "idle" | "reading" | "ok" | "error";

export type BriefSource = {
  url: string;
  status: SourceStatus;
  title?: string;
  text?: string;
  words?: number;
  pasted?: string;
  error?: string;
  showPaste?: boolean;
};

export type Brief = {
  topic: string;
  type: DocType;
  tone: number;
  length: Length;
  points: string[];
  sources: BriefSource[];
  audience: string;
};

export type Stamp = { proofId: number; hash: string; txHash: string; at: number; words: number };

export type Draft = {
  id: string;
  createdAt: number;
  updatedAt: number;
  brief: Brief;
  title: string;
  altTitles: string[];
  html: string;
  words: number;
  stamps: Stamp[];
};

export type Prefs = { aiLabel: boolean; serif: boolean; authorName: string };

const KEYS = { drafts: "ib.drafts.v1", current: "ib.current", prefs: "ib.prefs.v1" };
const MAX_DRAFTS = 30;
const MAX_SOURCE_TEXT = 20_000;
const memory = new Map<string, unknown>();
let available = true;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return (memory.has(key) ? memory.get(key) : fallback) as T;
    return JSON.parse(raw) as T;
  } catch {
    available = false;
    return (memory.has(key) ? memory.get(key) : fallback) as T;
  }
}

function write(key: string, value: unknown): boolean {
  memory.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    available = false;
    return false;
  }
}

/** Large source texts aren't persisted (quota); they're re-read on load. */
function slim(d: Draft): Draft {
  return {
    ...d,
    brief: {
      ...d.brief,
      sources: d.brief.sources.map((s) => (s.text && s.text.length > MAX_SOURCE_TEXT ? { ...s, text: undefined } : s)),
    },
  };
}

export const store = {
  get available() {
    return available;
  },
  drafts(): Draft[] {
    const list = read<Draft[]>(KEYS.drafts, []);
    return Array.isArray(list) ? list : [];
  },
  getDraft(id: string) {
    return this.drafts().find((d) => d.id === id) ?? null;
  },
  saveDraft(d: Draft) {
    const list = [slim(d), ...this.drafts().filter((x) => x.id !== d.id)].sort((a, b) => b.updatedAt - a.updatedAt);
    return write(KEYS.drafts, list.slice(0, MAX_DRAFTS));
  },
  deleteDraft(id: string) {
    write(KEYS.drafts, this.drafts().filter((d) => d.id !== id));
    if (this.currentId() === id) write(KEYS.current, null);
  },
  currentId(): string | null {
    return read<string | null>(KEYS.current, null);
  },
  setCurrent(id: string | null) {
    write(KEYS.current, id);
  },
  prefs(): Prefs {
    return { aiLabel: true, serif: false, authorName: "", ...read<Partial<Prefs>>(KEYS.prefs, {}) };
  },
  setPrefs(patch: Partial<Prefs>) {
    write(KEYS.prefs, { ...this.prefs(), ...patch });
  },
};

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function newDraft(): Draft {
  const now = Date.now();
  return {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    brief: { topic: "", type: "blog", tone: 0, length: "medium", points: ["", "", ""], sources: [{ url: "", status: "idle" }], audience: "" },
    title: "",
    altTitles: [],
    html: "",
    words: 0,
    stamps: [],
  };
}

export function duplicateDraft(d: Draft): Draft {
  const copy = newDraft();
  return { ...structuredClone(d), id: copy.id, createdAt: copy.createdAt, updatedAt: copy.updatedAt, stamps: [], title: d.title ? `${d.title} (copy)` : "" };
}
