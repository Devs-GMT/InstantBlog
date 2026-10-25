// Home page sections 1–8 (copy: docs/CONTENT_COPY.md §3).
import {
  ChevronDown,
  Clock,
  Feather,
  FileCode,
  Fingerprint,
  GraduationCap,
  Megaphone,
  Newspaper,
  NotebookPen,
  PenLine,
  ShieldCheck,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { CONFIG } from "@/lib/config";
import { BriefShot, EditorShot, ExportShot, ProofReceiptMock } from "./Mockups";
import { SAMPLE_PROOF } from "./sample";

export function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <Link href="/write/" className="banner-chip">
          <b>New</b> Export to Word &amp; PDF
        </Link>
        <h1>
          Write it once.
          <br />
          <span className="hl">Publish anywhere.</span>
        </h1>
        <p className="hero-sub">
          Pick a topic, a tone and your key points. InstantBlog drafts a sourced article in under a minute. Copy it, or download it as PDF or Word.
        </p>
        <div className="hero-cta">
          <Link href="/write/" className="btn btn-primary btn-lg">
            <NotebookPen size={18} /> Write my first post
          </Link>
          <span className="fine">Free. No sign-up. You only need a wallet to stamp.</span>
        </div>
        <div className="callouts" aria-label="Article types">
          <span className="chip chip-blue">Blog post</span>
          <span className="chip chip-violet">Article</span>
          <span className="chip chip-pink">How-to</span>
          <span className="chip chip-cyan">Listicle</span>
          <span className="chip chip-amber">Opinion</span>
        </div>
        <p className="lengths mono">~500 · ~900 · ~1,400 words</p>
        <div className="shot-stack" aria-hidden="true">
          <BriefShot className="shot-brief" />
          <EditorShot className="shot-editor" />
          <ExportShot className="shot-export" />
          <span className="hand-note">every fact gets a source</span>
        </div>
      </div>
    </section>
  );
}

const AUDIENCE: { title: string; text: string; icon: LucideIcon; tint: string }[] = [
  { title: "Students", text: "Essays and research summaries, with each fact tied to a reading you can cite.", icon: GraduationCap, tint: "blue" },
  { title: "Creators", text: "Newsletters and blog posts in the tone you pick: friendly, witty or casual.", icon: Feather, tint: "pink" },
  { title: "Founders", text: "Launch posts and product updates drafted from your notes and changelog links.", icon: Megaphone, tint: "violet" },
  { title: "Marketers", text: "SEO articles from product pages and reports, with the sources listed at the end.", icon: Newspaper, tint: "cyan" },
  { title: "Developers / DevRel", text: "Tutorials and changelogs drafted from your docs and pull requests.", icon: FileCode, tint: "green" },
  { title: "Hackathon teams", text: "The project write-up for the submission form, written while the demo is fresh.", icon: Timer, tint: "amber" },
];

export function Audience() {
  return (
    <section className="section" id="who">
      <div className="container">
        <div className="section-head">
          <h2>Who is it for?</h2>
          <p>People who already have the ideas and the links, and want the first draft done.</p>
        </div>
        <div className="grid-3">
          {AUDIENCE.map((a) => (
            <article className="card aud-card" key={a.title}>
              <div className="icon-tile" style={{ background: `var(--tint-${a.tint})`, color: `var(--ink-${a.tint})` }}>
                <a.icon size={20} strokeWidth={1.8} />
              </div>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Problem() {
  const items = [
    ["01", "Slow", "A first draft can take hours before any editing starts."],
    ["02", "Generic", "Most AI text reads the same whatever topic you give it."],
    ["03", "Unsourced", "A number with no link is hard to check and risky to publish."],
  ];
  return (
    <section className="section band ruled-band">
      <div className="container">
        <div className="problem-head">
          <h2 className="h2">Blank pages are a slow way to start writing</h2>
        </div>
        <div className="grid-3">
          {items.map(([n, t, d]) => (
            <div className="problem-block" key={t}>
              <span className="num">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    ["01", "Brief", "Topic, tone, 3 to 5 key points and up to 5 source links.", "blue"],
    ["02", "Draft", "The AI writes one section per point and cites your sources as [1], [2].", "violet"],
    ["03", "Polish", "Select a sentence to rewrite it, shorten it or change its tone.", "pink"],
    ["04", "Export & stamp", "Copy it, download PDF or Word, then stamp a proof on BOT Chain.", "cyan"],
  ];
  return (
    <section className="section" id="how">
      <div className="container">
        <div className="section-head">
          <h2>From idea to finished draft in four steps</h2>
        </div>
        <div className="grid-4 steps">
          {steps.map(([n, t, d, tint]) => (
            <div className="card step" key={n}>
              <span className={`chip chip-${tint} mono`}>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section className="section band" id="features">
      <div className="container">
        <div className="section-head">
          <h2>Built for writing with sources</h2>
        </div>

        <div className="feature">
          <div className="feature-text">
            <span className="chip chip-blue">Outline</span>
            <h3>Your key points become the sections</h3>
            <p>Each point gets its own heading, in the order you set. Drag a point up or down before you generate.</p>
            <ul className="checks">
              <li>Intro, conclusion and three title ideas included</li>
              <li>Short, medium or long: about 500, 900 or 1,400 words</li>
            </ul>
          </div>
          <div className="feature-visual">
            <BriefShot />
            <div className="example-card taped">
              <span className="tag">Outline from the brief</span>
              <strong>## Scope is a feature</strong>
              <br />
              <strong>## Demo beats docs</strong>
            </div>
          </div>
        </div>

        <div className="feature flip">
          <div className="feature-text">
            <span className="chip chip-violet">Citations</span>
            <h3>Every fact links back to a source</h3>
            <p>InstantBlog reads the pages you link and cites them inline. Hover a [1] in the editor to see which source it points to.</p>
            <ul className="checks">
              <li>Facts and numbers come only from your sources</li>
              <li>If a page won&apos;t load, paste its text instead</li>
            </ul>
          </div>
          <div className="feature-visual">
            <EditorShot />
            <div className="example-card taped">
              <span className="tag">Cited sentence</span>A hackathon goes by many names: hack day, hackfest, codefest <span className="cite">1</span>
              <br />
              <a className="muted" href="https://en.wikipedia.org/wiki/Hackathon" target="_blank" rel="noopener noreferrer">
                [1] Hackathon · Wikipedia
              </a>
            </div>
          </div>
        </div>

        <div className="feature">
          <div className="feature-text">
            <span className="chip chip-pink">AI editing</span>
            <h3>Edit with AI, keep your voice</h3>
            <p>Select text and pick Rewrite, Shorten, Expand, Simplify or a new tone. Nothing changes until you press Accept.</p>
            <ul className="checks">
              <li>Citations stay attached to their sentence</li>
              <li>Undo works on every change</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="shot ruled-shot" style={{ padding: 22 }}>
              <div className="bubble bubble-static">
                <span>Rewrite</span>
                <span className="on">Shorten</span>
                <span>Expand</span>
                <span>
                  Tone <ChevronDown size={13} />
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>
                <span className="diff-old">Pick the one flow you can demo in under a minute and build only that.</span>{" "}
                <span className="diff-new">Build only the one flow you can demo in a minute.</span>
              </p>
            </div>
            <div className="example-card taped">
              <span className="tag">Shorten preview</span>
              <span className="btn btn-xs btn-secondary">Discard</span> <span className="btn btn-xs btn-primary">Accept</span>
            </div>
          </div>
        </div>

        <div className="feature flip">
          <div className="feature-text">
            <span className="chip chip-cyan">Export</span>
            <h3>Paste into Docs, Notion or Medium, or download PDF and Word</h3>
            <p>Rich text keeps headings, links and lists. The .docx uses real Word heading styles, so the navigation pane works.</p>
            <ul className="checks">
              <li>Rich text, Markdown or plain text</li>
              <li>A4 PDF with a byline and the sources</li>
            </ul>
          </div>
          <div className="feature-visual">
            <ExportShot />
            <div className="example-card taped">
              <span className="tag">Downloaded</span>
              <PenLine size={13} style={{ verticalAlign: -2 }} /> why-small-dapps-win-hackathons.docx
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProofSection() {
  const trust: [LucideIcon, string, string, string][] = [
    [Fingerprint, "blue", "Only the fingerprint goes on-chain", "A SHA-256 hash, the title and a few counts. The article text stays in your browser."],
    [Clock, "violet", "Timestamped on-chain", "The proof records your wallet address and the block time."],
    [ShieldCheck, "green", "Anyone can verify a copy", "Paste a copy into Verify. One changed character means no match."],
  ];
  return (
    <section className="section proof-section" id="proof">
      <div className="container proof-grid">
        <ProofReceiptMock />
        <div>
          <h2 className="h2">Stamp it before you publish</h2>
          <p className="muted" style={{ marginTop: 12, fontSize: 18 }}>
            InstantBlog saves your article&apos;s fingerprint on BOT Chain. Anyone can check a copy against it later without seeing your text.
          </p>
          <div className="trust">
            {trust.map(([Ico, tint, t, d]) => (
              <div className="trust-item" key={t}>
                <div className="icon-tile" style={{ background: `var(--tint-${tint})`, color: `var(--ink-${tint})` }}>
                  <Ico size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Link href="/verify/" className="text-link">
              Verify an article →
            </Link>
            {CONFIG.USE_TESTNET && (
              <Link href={`/verify/?proof=${SAMPLE_PROOF.id}`} className="text-link muted">
                See the sample proof →
              </Link>
            )}
          </div>
          <p className="fine-print">A proof shows who stamped this exact text and when. It does not show that every word was written without AI.</p>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Is it free?", "Yes. Writing, editing and exports are free. Stamping costs a small network fee in BOT, paid from your own wallet. Hourly limits keep the AI available for everyone."],
  ["Which AI does it use?", "Google Gemini (a Flash model on the free tier). Google may use free-tier text to improve its products, so don't paste anything confidential into a brief."],
  ["Does the AI make things up?", "It is told to take facts, numbers and quotes only from your sources and to cite each one. It can still get things wrong, so check the facts before you publish. The citations show you where to look. Without sources, the draft says so at the top."],
  ["Which sources can it read?", "Most public pages: blogs, news, docs and Wikipedia. It can't read paywalled, login-only or private pages, so paste their text instead. Up to 5 sources per article."],
  ["Can I edit the draft?", "Yes. Type anywhere, use the toolbar for headings, lists and links, or select text and ask the AI to rewrite, shorten, expand, simplify or change the tone. Every AI change waits for you to accept it."],
  ["Which formats can I download?", "PDF and Word (.docx). You can also copy rich text for Google Docs, Notion or Medium, or copy Markdown or plain text."],
  ["What goes on BOT Chain?", "A SHA-256 fingerprint of your article, its title, word count, tone, number of sources, your wallet address and the time. The article text never goes on-chain."],
  ["Do I need a wallet?", "Only to stamp. Writing, editing, downloading and verifying work without one."],
];

export function Faq() {
  return (
    <section className="section" id="faq">
      <div className="container faq-grid">
        <div>
          <h2 className="h2">Questions, answered</h2>
          <p>
            The code is open source{" "}
            <a href={CONFIG.GITHUB_URL} target="_blank" rel="noopener noreferrer">
              on GitHub
            </a>
            .
          </p>
        </div>
        <div className="faq">
          {FAQ.map(([q, a], i) => (
            <details key={q} name="faq" open={i === 0}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  const cards = [
    ["How-to", "Friendly", "How to deploy your first contract"],
    ["Listicle", "Witty", "7 tools every hackathon team needs"],
    ["Opinion", "Inspiring", "Small dApps win hackathons"],
  ];
  return (
    <section className="cta-band">
      <h2>Write your first sourced article</h2>
      <p>Bring a topic, three key points and a few links.</p>
      <Link href="/write/" className="btn btn-invert btn-lg">
        <NotebookPen size={18} /> Write my first post
      </Link>
      <div className="fan" aria-hidden="true">
        {cards.map(([type, tone, title]) => (
          <div className="fan-card ruled" key={title}>
            <div className="mini-chips">
              <span className="chip chip-violet">{type}</span>
              <span className="chip chip-blue">{tone}</span>
              <span className="chip chip-green">3 sources</span>
            </div>
            <h4>{title}</h4>
            <div className="fan-lines">
              <i /> <i /> <i /> <i /> <i />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
