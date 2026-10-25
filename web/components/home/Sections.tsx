// Home page sections 1–8 (copy: docs/CONTENT_COPY.md §3).
import Link from "next/link";
import { Icon } from "../Icons";
import { BriefShot, EditorShot, ExportShot, ProofReceiptMock } from "./Mockups";

export function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <Link href="/write/" className="banner-chip">
          <b>New</b> Export to Word &amp; PDF
        </Link>
        <h1>Write it once. Publish anywhere.</h1>
        <p className="hero-sub">
          Pick a topic, a tone and your key points. InstantBlog drafts a sourced article in seconds — copy it or download it as PDF or Word.
        </p>
        <div className="hero-cta">
          <Link href="/write/" className="btn btn-primary btn-lg">
            Write my first post
          </Link>
          <span className="fine">Free · No sign-up · Wallet only needed to stamp</span>
        </div>
        <div className="callouts" aria-label="Formats">
          <span className="chip chip-blue">Blog post <small>~500 words</small></span>
          <span className="chip chip-violet">Article <small>~900 words</small></span>
          <span className="chip chip-pink">How-to <small>~1,400 words</small></span>
          <span className="chip chip-cyan">Listicle <small>3–5 points</small></span>
        </div>
        <div className="shot-stack" aria-hidden="true">
          <BriefShot className="shot-brief" />
          <EditorShot className="shot-editor" />
          <ExportShot className="shot-export" />
        </div>
      </div>
    </section>
  );
}

const AUDIENCE = [
  { title: "Students", text: "Essays and research summaries, with every fact linked to your readings.", icon: Icon.cap, tint: "blue" },
  { title: "Creators", text: "Newsletters and blog posts in your voice — friendly, witty or anything between.", icon: Icon.pen, tint: "pink" },
  { title: "Founders", text: "Launch posts and updates your community will actually read.", icon: Icon.rocket, tint: "violet" },
  { title: "Marketers", text: "Clear, sourced SEO articles from product pages and reports.", icon: Icon.chart, tint: "cyan" },
  { title: "Developers / DevRel", text: "Tutorials and changelogs drafted from your docs.", icon: Icon.code, tint: "green" },
  { title: "Hackathon teams", text: "Project write-ups ready before the demo ends.", icon: Icon.bolt, tint: "amber" },
];

export function Audience() {
  return (
    <section className="section" id="who">
      <div className="container">
        <div className="section-head">
          <h2>Who is it for?</h2>
          <p>Anyone with something to say and not much time to say it.</p>
        </div>
        <div className="grid-3">
          {AUDIENCE.map((a) => (
            <article className="card aud-card" key={a.title}>
              <div className="icon-tile" style={{ background: `var(--tint-${a.tint})`, color: `var(--ink-${a.tint})` }}>
                <a.icon />
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
    ["01", "Slow", "Hours go into getting a first draft on the page."],
    ["02", "Generic", "Most AI text sounds like everyone else's — and nothing like you."],
    ["03", "Unsourced", "Facts with no links you can check are a risk to publish."],
  ];
  return (
    <section className="section band">
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
    ["01", "Brief", "Topic, tone, 3–5 key points and up to 5 source links.", "blue"],
    ["02", "Draft", "AI writes a structured article, with a [1][2] citation on every fact from your sources.", "violet"],
    ["03", "Polish", "Select any sentence to rewrite, shorten or change its tone.", "pink"],
    ["04", "Export & stamp", "Copy, PDF or Word — then stamp a proof on BOT Chain.", "cyan"],
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
          <h2>We designed a faster way to write with sources</h2>
        </div>

        <div className="feature">
          <div className="feature-text">
            <span className="chip chip-blue">Brief → outline</span>
            <h3>Turn 3 bullet points into a structured article</h3>
            <p>Each key point becomes its own section, in your order. Drag to reorder before you generate.</p>
            <ul className="checks">
              <li>One H2 per point</li>
              <li>Intro and conclusion included</li>
              <li>3 title ideas</li>
            </ul>
          </div>
          <div className="feature-visual">
            <BriefShot />
            <div className="example-card">
              <span className="tag">Example outline</span>
              <strong>## Scope is a feature</strong>
              <br />
              <strong>## Demo beats docs</strong>
              <br />
              <strong>## Judges reward clarity</strong>
            </div>
          </div>
        </div>

        <div className="feature flip">
          <div className="feature-text">
            <span className="chip chip-violet">Citations</span>
            <h3>Every fact links back to your sources</h3>
            <p>InstantBlog reads your links and cites them as [1], [2]. Hover a citation to see where it came from.</p>
            <ul className="checks">
              <li>Uses only your sources for facts</li>
              <li>Sources list added for you</li>
              <li>Paste text when a page can&apos;t be read</li>
            </ul>
          </div>
          <div className="feature-visual">
            <EditorShot />
            <div className="example-card">
              <span className="tag">Example citation</span>
              Most winning teams ship one flow that works end-to-end <span className="cite">1</span>
              <br />
              <span className="muted">[1] Hackathon judging guide — devpost.com</span>
            </div>
          </div>
        </div>

        <div className="feature">
          <div className="feature-text">
            <span className="chip chip-pink">AI editing</span>
            <h3>Edit with AI, keep your voice</h3>
            <p>Select text and choose Rewrite, Shorten, Expand, Simplify or a new tone. Preview every change before you accept it.</p>
            <ul className="checks">
              <li>Accept or discard</li>
              <li>Citations kept</li>
              <li>Undo always works</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="shot" style={{ padding: 22 }}>
              <div className="bubble" style={{ position: "relative", transform: "none", display: "inline-flex", marginBottom: 14 }}>
                <span style={{ padding: "6px 10px", fontSize: 12.5 }}>Rewrite</span>
                <span style={{ padding: "6px 10px", fontSize: 12.5, background: "rgba(255,255,255,.14)", borderRadius: 100 }}>Shorten</span>
                <span style={{ padding: "6px 10px", fontSize: 12.5 }}>Expand</span>
                <span style={{ padding: "6px 10px", fontSize: 12.5 }}>Tone ⌄</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>
                <span className="diff-old">A tight scope leaves you a lot more time at the end of the weekend to polish the experience</span>{" "}
                <span className="diff-new">A tight scope leaves time for polish</span> <span className="cite">2</span>
              </p>
            </div>
            <div className="example-card">
              <span className="tag">Shorten · preview</span>
              <span className="btn btn-xs btn-secondary">Discard</span> <span className="btn btn-xs btn-primary">Accept</span>
            </div>
          </div>
        </div>

        <div className="feature flip">
          <div className="feature-text">
            <span className="chip chip-cyan">Exports</span>
            <h3>Copy to Docs, Notion or Medium — or download PDF and Word</h3>
            <p>Rich text keeps headings, links and lists. PDF and Word files come out clean and ready to share.</p>
            <ul className="checks">
              <li>Rich text, Markdown, plain text</li>
              <li>A4 PDF</li>
              <li>.docx with headings</li>
            </ul>
          </div>
          <div className="feature-visual">
            <ExportShot />
            <div className="example-card">
              <span className="tag">Example export</span>
              why-small-dapps-win-hackathons.docx <span className="muted">· 18 KB</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProofSection() {
  return (
    <section className="section proof-section" id="proof">
      <div className="container proof-grid">
        <ProofReceiptMock />
        <div>
          <h2 className="h2">Prove you wrote it first</h2>
          <p className="muted" style={{ marginTop: 12, fontSize: 18 }}>
            Stamp your article on BOT Chain. Anyone can check a copy against your proof, without seeing your text.
          </p>
          <div className="trust">
            {[
              [Icon.lock, "blue", "Only the fingerprint goes on-chain", "We save a SHA-256 fingerprint, the title and a few numbers. Never your article."],
              [Icon.clock, "violet", "Timestamped forever", "The proof records your wallet and the exact time you stamped it."],
              [Icon.check, "green", "Anyone can verify a copy", "Paste any copy into Verify to see if it matches a proof."],
            ].map(([I, tint, t, d]) => {
              const Ico = I as () => React.JSX.Element;
              return (
                <div className="trust-item" key={t as string}>
                  <div className="icon-tile" style={{ background: `var(--tint-${tint})`, color: `var(--ink-${tint})` }}>
                    <Ico />
                  </div>
                  <div>
                    <h3>{t as string}</h3>
                    <p>{d as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/verify/" className="text-link">
            Verify an article →
          </Link>
          <p className="fine-print">A proof shows who stamped this exact text and when — not that every word was written without AI.</p>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Is it free?", "Yes. Writing, editing and exports are free. Stamping on BOT Chain costs a tiny network fee in BOT, paid from your own wallet. There are hourly limits to keep the AI fair for everyone."],
  ["Does the AI make things up?", "We tell it to use only your sources for facts, numbers and quotes, and to cite each one. It can still make mistakes, so always check facts — and the citations make that quick. With no sources, the draft says so at the top."],
  ["Which sources can it read?", "Most public web pages: blogs, news, docs and Wikipedia. Paywalled, login-only or private pages can't be read; paste their text instead. Up to 5 sources per article."],
  ["Can I edit the draft?", "Of course. Type anywhere, use the toolbar for headings, lists and links, or select text and ask the AI to rewrite, shorten, expand, simplify or change the tone. Every AI change waits for your OK."],
  ["Which formats can I download?", "PDF and Word (.docx). You can also copy rich text for Google Docs, Notion or Medium, or copy Markdown or plain text."],
  ["What goes on BOT Chain?", "A SHA-256 fingerprint of your article, its title, word count, tone, number of sources, your wallet address and the time. The article text never leaves your browser for the chain."],
  ["Do I need a wallet?", "Only to stamp. You can write, edit and download without one. Verifying a copy doesn't need a wallet either."],
];

export function Faq() {
  return (
    <section className="section" id="faq">
      <div className="container faq-grid">
        <div>
          <h2 className="h2">Questions, answered</h2>
          <p>Still curious? The code is open on GitHub.</p>
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
      <h2>Create a sourced article in seconds</h2>
      <p>Your topic, your points, your sources — drafted, polished and ready to publish.</p>
      <Link href="/write/" className="btn btn-invert btn-lg">
        Write my first post
      </Link>
      <div className="fan" aria-hidden="true">
        {cards.map(([type, tone, title]) => (
          <div className="fan-card" key={title}>
            <div className="mini-chips">
              <span className="chip chip-violet">{type}</span>
              <span className="chip chip-blue">{tone}</span>
              <span className="chip chip-green">3 sources</span>
            </div>
            <h4>{title}</h4>
            <div className="fan-lines">
              <i /> <i /> <i /> <i /> <i /> <i />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
