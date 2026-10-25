// Dev-only canned AI responses (MOCK_AI="1" in .dev.vars). Never enable in production.
import type { DraftInput, EditInput } from "./limits";
import { missingCitations } from "./limits";

export function mockDraftMarkdown(d: DraftInput): string {
  const cite = (i: number) => (d.sources.length ? ` [${(i % d.sources.length) + 1}]` : "");
  const sections = d.points
    .map(
      (p, i) =>
        `## ${p}\n\nThis section explains why "${p}" matters for ${d.audience || "readers"}. It keeps the idea concrete and short${cite(i)}.\n\n- One practical takeaway\n- A second, related **tip**`,
    )
    .join("\n\n");
  const note = d.sources.length ? "" : "> ⚠ No sources added — check facts before publishing.\n\n";
  const sources = d.sources.length
    ? `\n\n## Sources\n\n${d.sources.map((s, i) => `${i + 1}. [${s.n}] ${s.title} — ${s.url ?? "(pasted text)"}`).join("\n")}`
    : "";
  return `# ${d.topic}\n<!-- titles: ${d.topic}: a quick guide | What nobody tells you about ${d.topic.toLowerCase()} | ${d.points.length} ideas on ${d.topic.toLowerCase()} -->\n\n${note}This is a mock draft from the dev Worker. It follows your brief and key points in order${cite(0)}.\n\n${sections}\n\n## Conclusion\n\nThat's the short version. Pick one idea and try it this week.${sources}\n`;
}

export function mockDraftStream(d: DraftInput, cors: Record<string, string>): Response {
  const md = mockDraftMarkdown(d);
  const enc = new TextEncoder();
  const chunks = md.match(/[\s\S]{1,24}/g) ?? [];
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: string, data: unknown) => controller.enqueue(enc.encode(`event: ${e}\ndata: ${JSON.stringify(data)}\n\n`));
      send("meta", { model: "mock", sources: d.sources.length });
      for (const t of chunks) {
        send("delta", { t });
        await new Promise((r) => setTimeout(r, 25));
      }
      send("done", { stop: "end_turn", fallback: false, outputTokens: 0 });
      controller.close();
    },
  });
  return new Response(body, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", ...cors } });
}

export function mockEdit(e: EditInput) {
  if (e.action === "titles") {
    return { titles: [`${e.brief.topic} (mock A)`, `${e.brief.topic} — mock B`, `Mock C: ${e.brief.topic}`] };
  }
  const sel = e.selection;
  const text: Record<string, string> = {
    rewrite: `${sel} (rewritten)`,
    shorten: sel.split(" ").slice(0, Math.max(3, Math.ceil(sel.split(" ").length / 2))).join(" ") + (sel.match(/\[\d+\]/g)?.join("") ?? ""),
    expand: `${sel} Here is one more sentence that adds an example.`,
    tone: `${sel} (new tone)`,
    simplify: `${sel} (simpler)`,
    grammar: sel.replace(/\btheir is\b/gi, "There is").replace(/\ba error\b/gi, "an error"),
    intro: "A fresh mock intro that hooks the reader in one line.",
    conclusion: "## Conclusion\n\nA mock conclusion that pulls the sections together.",
    section: `## ${e.sectionTopic}\n\nA mock section about ${e.sectionTopic}.`,
  };
  const out = text[e.action] ?? sel;
  return { text: out, missingCitations: sel ? missingCitations(sel, out) : [] };
}
