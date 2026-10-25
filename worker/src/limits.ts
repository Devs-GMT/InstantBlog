// Request validation + input caps for /blog/draft and /blog/edit.
import { HttpError } from "./http";

export type DocType = "blog" | "article" | "howto" | "listicle" | "opinion";
export type Length = "short" | "medium" | "long";
export type Source = { n: number; title: string; url: string | null; text: string };

export interface DraftInput {
  topic: string;
  type: DocType;
  tone: number;
  length: Length;
  points: string[];
  audience: string;
  sources: Source[];
}

export const EDIT_ACTIONS = [
  "rewrite", "shorten", "expand", "tone", "simplify", "grammar", "intro", "conclusion", "titles", "section",
] as const;
export type EditAction = (typeof EDIT_ACTIONS)[number];

export interface EditInput {
  action: EditAction;
  selection: string;
  paragraph: string;
  tone?: number;
  sectionTopic?: string;
  brief: { topic: string; type: DocType; tone: number; audience: string; points: string[] };
  outline: string[];
  sources: Source[];
}

const TYPES: DocType[] = ["blog", "article", "howto", "listicle", "opinion"];
const LENGTHS: Length[] = ["short", "medium", "long"];

/** Draft sources share ~40k chars (~10k tokens); total request stays under ~12k tokens. */
export const DRAFT_SOURCE_BUDGET = 40_000;
const EDIT_SOURCE_BUDGET = 12_000;
const TOKEN_CAP = 12_000;

function bad(field: string): never {
  throw new HttpError(400, "bad_request", `Invalid field: ${field}`);
}

function str(v: unknown, field: string, min: number, max: number, optional = false): string {
  if (v === undefined || v === null || v === "") {
    if (optional) return "";
    bad(field);
  }
  if (typeof v !== "string") bad(field);
  const s = v.trim();
  if (s.length < min || s.length > max) bad(field);
  return s;
}

function tone(v: unknown, field = "tone"): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 5) bad(field);
  return v;
}

function oneOf<T extends string>(v: unknown, list: readonly T[], field: string): T {
  if (typeof v !== "string" || !list.includes(v as T)) bad(field);
  return v as T;
}

function points(v: unknown, min: number): string[] {
  if (!Array.isArray(v) || v.length < min || v.length > 5) bad("points");
  return v.map((p, i) => str(p, `points[${i}]`, 1, 200));
}

function sources(v: unknown, perSourceMax: number): Source[] {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > 5) bad("sources");
  const seen = new Set<number>();
  return v.map((s, i) => {
    if (!s || typeof s !== "object") bad(`sources[${i}]`);
    const o = s as Record<string, unknown>;
    const n = o.n;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 5 || seen.has(n)) bad(`sources[${i}].n`);
    seen.add(n);
    const url = o.url == null || o.url === "" ? null : str(o.url, `sources[${i}].url`, 8, 2048);
    if (url && !/^https?:\/\//i.test(url)) bad(`sources[${i}].url`);
    return {
      n,
      title: str(o.title, `sources[${i}].title`, 0, 200, true) || (url ? new URL(url).hostname : `Source ${n}`),
      url,
      text: str(o.text, `sources[${i}].text`, 1, perSourceMax),
    };
  });
}

/** Trim each source to an equal share of the budget, cutting at a sentence boundary. */
export function fitSources(list: Source[], budget: number): Source[] {
  const total = list.reduce((a, s) => a + s.text.length, 0);
  if (total <= budget) return list;
  const share = Math.floor(budget / list.length);
  return list.map((s) => {
    if (s.text.length <= share) return s;
    const cut = s.text.slice(0, share);
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
    return { ...s, text: end > share * 0.6 ? cut.slice(0, end + 1) : cut };
  });
}

export const estimateTokens = (...parts: string[]) => Math.ceil(parts.reduce((a, p) => a + p.length, 0) / 4);

export function parseDraft(body: Record<string, unknown>): DraftInput {
  const d: DraftInput = {
    topic: str(body.topic, "topic", 5, 160),
    type: oneOf(body.type, TYPES, "type"),
    tone: tone(body.tone),
    length: oneOf(body.length, LENGTHS, "length"),
    points: points(body.points, 3),
    audience: str(body.audience, "audience", 0, 80, true),
    sources: fitSources(sources(body.sources, 25_000), DRAFT_SOURCE_BUDGET),
  };
  return d;
}

export function parseEdit(body: Record<string, unknown>): EditInput {
  const action = oneOf(body.action, EDIT_ACTIONS, "action");
  const needsSelection = !["intro", "conclusion", "titles", "section"].includes(action);
  const b = (body.brief ?? {}) as Record<string, unknown>;
  const e: EditInput = {
    action,
    selection: str(body.selection, "selection", needsSelection ? 1 : 0, 6000, !needsSelection),
    paragraph: str(body.paragraph, "paragraph", 0, 8000, true),
    tone: action === "tone" ? tone(body.tone) : undefined,
    sectionTopic: action === "section" ? str(body.sectionTopic, "sectionTopic", 2, 160) : undefined,
    brief: {
      topic: str(b.topic, "brief.topic", 1, 160),
      type: oneOf(b.type, TYPES, "brief.type"),
      tone: tone(b.tone, "brief.tone"),
      audience: str(b.audience, "brief.audience", 0, 80, true),
      points: Array.isArray(b.points) ? b.points.slice(0, 5).map((p, i) => str(p, `brief.points[${i}]`, 0, 200, true)) : [],
    },
    outline: Array.isArray(body.outline)
      ? body.outline.slice(0, 20).map((h, i) => str(h, `outline[${i}]`, 0, 200, true)).filter(Boolean)
      : [],
    sources: fitSources(sources(body.sources, 25_000), EDIT_SOURCE_BUDGET),
  };
  if (estimateTokens(e.selection, e.paragraph, ...e.sources.map((s) => s.text), ...e.outline) > TOKEN_CAP) {
    throw new HttpError(413, "too_large", "That's too much text for one request.");
  }
  return e;
}

/** Citation markers present in `before` but missing from `after`. */
export function missingCitations(before: string, after: string): number[] {
  const ids = (s: string) => new Set([...s.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])));
  const a = ids(after);
  return [...ids(before)].filter((n) => !a.has(n)).sort((x, y) => x - y);
}
