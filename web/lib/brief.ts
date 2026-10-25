// Brief validation and payload helpers. PRD B-6, B-8.
import type { Brief } from "./store";

export const READ_ERRORS: Record<string, string> = {
  blocked_address: "That address isn't allowed.",
  bad_url: "That doesn't look like a web link.",
  timeout: "The page took too long to respond.",
  too_large: "The page is too large to read.",
  not_html: "That link isn't a web page.",
  http_error: "The page returned an error.",
  empty: "We couldn't find article text on that page.",
  network: "Couldn't reach the server.",
  rate_limited: "Too many source reads this hour.",
};

export const isUrl = (s: string) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(s.trim());

export function hostOf(u: string) {
  try {
    return new URL(u).hostname;
  } catch {
    return "Source";
  }
}

export type PayloadSource = { n: number; title: string; url: string | null; text: string };

/** Usable sources keep their list position as n, so chip numbers match citations. */
export function usableSources(brief: Brief): PayloadSource[] {
  return brief.sources
    .map((s, i) => ({ s, n: i + 1 }))
    .filter(({ s }) => (s.status === "ok" && s.text) || (s.pasted && s.pasted.trim()))
    .map(({ s, n }) => {
      const read = s.status === "ok" && !!s.text;
      return {
        n,
        title: (s.title || (read ? hostOf(s.url) : "Pasted source")).slice(0, 200),
        url: read ? s.url.trim() : null,
        text: read ? (s.text as string) : (s.pasted as string).trim(),
      };
    });
}

export function validate(brief: Brief): { ok: boolean; hint: string } {
  const filled = brief.points.filter((p) => p.trim()).length;
  if (brief.topic.trim().length < 5) return { ok: false, hint: "Add a topic to start" };
  if (filled < 3) {
    const n = 3 - filled;
    return { ok: false, hint: `Add ${n} more key point${n > 1 ? "s" : ""} — 3 needed` };
  }
  if (brief.sources.some((s) => s.status === "reading")) return { ok: false, hint: "Waiting for sources…" };
  return { ok: true, hint: "" };
}

export const skippedCount = (brief: Brief) =>
  brief.sources.filter((s) => s.url.trim() && s.status !== "ok" && !s.pasted?.trim()).length;

export function draftPayload(brief: Brief) {
  return {
    topic: brief.topic.trim(),
    type: brief.type,
    tone: brief.tone,
    length: brief.length,
    points: brief.points.map((p) => p.trim()).filter(Boolean),
    audience: brief.audience.trim(),
    sources: usableSources(brief),
  };
}
