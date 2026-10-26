// Desk objects around the hero headline: sticky notes (the brief, the key points, a source), a pencil and a
// paper clip. Decorative (aria-hidden); the content mirrors the real sample brief on this page.

function Pencil() {
  return (
    <svg className="desk-pencil" viewBox="0 0 220 26" aria-hidden="true">
      <defs>
        <linearGradient id="pencil-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD54A" />
          <stop offset=".5" stopColor="#F5B800" />
          <stop offset="1" stopColor="#D99A00" />
        </linearGradient>
      </defs>
      <rect x="22" y="4" width="160" height="18" fill="url(#pencil-body)" />
      <rect x="22" y="12.3" width="160" height="1.4" fill="#C98E00" opacity=".55" />
      <rect x="182" y="3" width="16" height="20" rx="1.5" fill="#B9BDC6" />
      <rect x="186" y="3" width="2" height="20" fill="#8F95A1" />
      <rect x="192" y="3" width="2" height="20" fill="#8F95A1" />
      <rect x="198" y="3.5" width="20" height="19" rx="6" fill="#F28CA8" />
      <path d="M22 4 L2 13 L22 22 Z" fill="#F2D3A6" />
      <path d="M8.6 10 L2 13 L8.6 16 Z" fill="#2B2F3A" />
    </svg>
  );
}

function PaperClip() {
  return (
    <svg className="desk-clip" viewBox="0 0 30 76" aria-hidden="true">
      <path
        d="M9 20 V58 a8 8 0 0 0 16 0 V14 a12 12 0 0 0 -24 0 V60"
        fill="none"
        stroke="#9AA3B2"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeroNotes() {
  return (
    <div className="desk" aria-hidden="true">
      <div className="sticky sticky--yellow desk-note desk-note--topic" style={{ "--tilt": "-6deg", "--flex": "1.1", "--i": 0 } as React.CSSProperties}>
        <span className="tape" />
        <span className="note-label">topic</span>
        <p className="note-hand">why small dApps win hackathons</p>
      </div>
      <Pencil />

      <div className="sticky sticky--pink desk-note desk-note--points" style={{ "--tilt": "5deg", "--flex": "0.9", "--i": 1 } as React.CSSProperties}>
        <PaperClip />
        <span className="note-label">key points</span>
        <ol className="note-hand note-list">
          <li>scope is a feature</li>
          <li>demo beats docs</li>
          <li>judges reward clarity</li>
        </ol>
      </div>

      <div className="sticky sticky--blue desk-note desk-note--source" style={{ "--tilt": "-3deg", "--flex": "1.25", "--i": 2 } as React.CSSProperties}>
        <span className="tape tape--blue" />
        <span className="note-label">source [1]</span>
        <p className="note-hand">wikipedia / hackathon</p>
      </div>
    </div>
  );
}
