// Product "screenshots" built from our own UI pieces (no external images).

export function BriefShot({ className = "" }: { className?: string }) {
  return (
    <div className={`shot ${className}`}>
      <div className="shot-bar">
        <i /> <i /> <i /> <span style={{ marginLeft: 6 }}>Your brief</span>
      </div>
      <div className="shot-body">
        <div className="mini-label">What&apos;s it about?</div>
        <div className="mini-input">Why small dApps win hackathons</div>
        <div className="mini-label">Voice tone</div>
        <div className="mini-chips">
          <span className="chip chip-panel">Friendly</span>
          <span className="chip" style={{ background: "var(--primary)", color: "#fff" }}>Witty</span>
          <span className="chip chip-panel">Academic</span>
        </div>
        <div className="mini-label">Key points</div>
        <div className="mini-input">1 · Scope is a feature</div>
        <div className="mini-input">2 · Demo beats docs</div>
        <div className="mini-input">3 · Judges reward clarity</div>
        <div className="mini-label">Sources</div>
        <div className="mini-chips">
          <span className="chip chip-green">✓ Read · DevPost guide</span>
          <span className="chip chip-green">✓ Read · MLH blog</span>
        </div>
      </div>
    </div>
  );
}

export function EditorShot({ className = "" }: { className?: string }) {
  return (
    <div className={`shot ${className}`}>
      <div className="shot-bar">
        <i /> <i /> <i /> <span style={{ marginLeft: 6 }}>Draft · 912 words · 4 min read</span>
      </div>
      <div className="shot-body mini-paper" style={{ padding: "26px 30px" }}>
        <h4>Why small dApps win hackathons</h4>
        <p>
          Weekend judges see dozens of demos. The teams that win usually ship one thing that works end-to-end <span className="cite">1</span>.
        </p>
        <h5>Scope is a feature</h5>
        <p>
          A tight scope leaves time for polish, and polish is what people remember <span className="cite">2</span>. Pick the one flow you can demo in
          under a minute.
        </p>
        <h5>Demo beats docs</h5>
        <p>A clear 60-second demo does more than a long README. Show the result first, then how it works.</p>
        <h5>Sources</h5>
        <p style={{ fontSize: 11.5 }}>
          [1] Hackathon judging guide — devpost.com
          <br />
          [2] What makes a winning hack — mlh.io
        </p>
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
        <div style={{ marginTop: 8, borderTop: "1px solid var(--border)", borderRadius: 0, paddingTop: 12 }}>
          <span className="chip chip-violet" style={{ height: 24, fontSize: 11.5 }}>Stamp on BOT Chain</span>
        </div>
      </div>
    </div>
  );
}

export function ProofReceiptMock() {
  return (
    <div className="receipt">
      <div className="receipt-head">
        <h3>Proof of authorship</h3>
        <span className="mono muted">#12</span>
      </div>
      <div className="receipt-sep" style={{ marginTop: 0 }} />
      {[
        ["Title", "Why small dApps win hackathons"],
        ["Words", "1,024"],
        ["Tone", "Witty"],
        ["Sources", "3"],
        ["Date", "Oct 23, 2026"],
        ["Author", "0xAB12…9f3c"],
      ].map(([k, v]) => (
        <div className="receipt-row" key={k}>
          <span>{k}</span>
          <span className={k === "Author" ? "mono" : ""}>{v}</span>
        </div>
      ))}
      <div className="receipt-sep" />
      <div className="receipt-row receipt-total">
        <span>Status</span>
        <span className="ok">✓ Verified on-chain</span>
      </div>
      <span className="btn btn-primary btn-block" aria-hidden="true">
        View on explorer ↗
      </span>
    </div>
  );
}
