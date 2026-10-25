// Product shots built from our own UI pieces. All content is real: the sample article in sample.ts
// is stamped on BOT Chain testnet as proof #2, and its one fact is cited to the Wikipedia page it came from.
import Link from "next/link";
import { CONFIG } from "@/lib/config";
import { shortAddr } from "@/lib/format";
import { SAMPLE_PROOF } from "./sample";

export function BriefShot({ className = "" }: { className?: string }) {
  return (
    <div className={`shot spiral ${className}`}>
      <div className="shot-bar">
        <i /> <i /> <i /> <span style={{ marginLeft: 6 }}>Your brief</span>
      </div>
      <div className="shot-body">
        <div className="mini-label">What&apos;s it about?</div>
        <div className="mini-input">Why small dApps win hackathons</div>
        <div className="mini-label">Voice tone</div>
        <div className="mini-chips">
          <span className="chip" style={{ background: "var(--primary)", color: "#fff" }}>Friendly</span>
          <span className="chip chip-panel">Witty</span>
          <span className="chip chip-panel">Academic</span>
        </div>
        <div className="mini-label">Key points</div>
        <div className="mini-input">1 · Scope is a feature</div>
        <div className="mini-input">2 · Demo beats docs</div>
        <div className="mini-label">Sources</div>
        <div className="mini-chips">
          <span className="chip chip-green">✓ Read · Hackathon (Wikipedia)</span>
        </div>
      </div>
    </div>
  );
}

export function EditorShot({ className = "" }: { className?: string }) {
  return (
    <div className={`shot ${className}`}>
      <div className="shot-bar">
        <i /> <i /> <i /> <span style={{ marginLeft: 6 }}>Draft · {SAMPLE_PROOF.words} words · 1 min read</span>
      </div>
      <div className="shot-body mini-paper ruled">
        <h4>Why small dApps win hackathons</h4>
        <p>
          A hackathon goes by many names: hack day, hackfest, codefest <span className="cite">1</span>. Whatever you call it, you get one weekend to show
          something that works.
        </p>
        <h5>Scope is a feature</h5>
        <p>Pick the one flow you can demo in under a minute and build only that. Everything else can wait for version two.</p>
        <h5>Demo beats docs</h5>
        <p>Show the result first, then explain how it works.</p>
        <h5>Sources</h5>
        <p className="mini-src">[1] Hackathon · en.wikipedia.org/wiki/Hackathon</p>
      </div>
    </div>
  );
}

export function ExportShot({ className = "" }: { className?: string }) {
  return (
    <div className={`shot ${className}`}>
      <div className="shot-bar">
        <i /> <i /> <i /> <span style={{ marginLeft: 6 }}>Export</span>
      </div>
      <div className="shot-body mini-menu">
        <div>
          Rich text <span className="ok">Copied ✓</span>
        </div>
        <div>Markdown</div>
        <div>Plain text</div>
        <div>Download PDF</div>
        <div>Download .docx</div>
        <div className="mini-menu-foot">
          <span className="chip chip-violet" style={{ height: 24, fontSize: 11.5 }}>
            Stamp on BOT Chain
          </span>
        </div>
      </div>
    </div>
  );
}

/** The real proof of the sample article. */
export function ProofReceiptMock() {
  const rows: [string, string][] = [
    ["Title", "Why small dApps win hackathons"],
    ["Words", String(SAMPLE_PROOF.words)],
    ["Tone", SAMPLE_PROOF.tone],
    ["Sources", String(SAMPLE_PROOF.sources)],
    ["Date", SAMPLE_PROOF.date],
    ["Author", shortAddr(SAMPLE_PROOF.author)],
  ];
  return (
    <div className="receipt">
      <div className="receipt-head">
        <h3>Proof of authorship</h3>
        <span className="mono muted">#{SAMPLE_PROOF.id} · testnet</span>
      </div>
      <div className="receipt-sep" style={{ marginTop: 0 }} />
      {rows.map(([k, v]) => (
        <div className="receipt-row" key={k}>
          <span>{k}</span>
          <span className={k === "Author" ? "mono" : ""}>{v}</span>
        </div>
      ))}
      <div className="receipt-sep" />
      <div className="receipt-row receipt-total">
        <span>Status</span>
        <span className="ok">✓ On-chain</span>
      </div>
      {CONFIG.USE_TESTNET ? (
        <Link className="btn btn-primary btn-block" href={`/verify/?proof=${SAMPLE_PROOF.id}`}>
          Open this proof
        </Link>
      ) : (
        <a className="btn btn-primary btn-block" href={`https://scan.bohr.life/address/0x4625aF5b93bB0C53Af096E34005b9E32Cb61F72a`} target="_blank" rel="noopener noreferrer">
          View on testnet explorer ↗
        </a>
      )}
    </div>
  );
}
