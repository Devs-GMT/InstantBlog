"use client";
// Receipt-style proof card. Used after stamping (writer) and on /verify?proof=N. PRD P-4, V-4.
import type { Proof } from "@/lib/chain";
import { CONFIG, TONES } from "@/lib/config";
import { copyText, fmtDate, fmtNum, shortAddr } from "@/lib/format";
import { useUI } from "./Providers";
import { Receipt } from "./Receipt";

export const proofLink = (id: number) => `${CONFIG.SITE_URL}/verify/?proof=${id}`;

export function ProofCard({ proof, txHash, versions, onClose }: { proof: Proof; txHash?: string; versions?: number[]; onClose?: () => void }) {
  const { toast } = useUI();
  return (
    <div style={{ position: "relative" }}>
      {onClose && (
        <button type="button" className="icon-btn proof-close" aria-label="Close proof card" onClick={onClose}>
          ×
        </button>
      )}
      <Receipt
        title={`Stamped #${proof.id}`}
        badge={onClose ? undefined : `#${proof.id}`}
        rows={[
          { label: "Title", value: proof.title, title: proof.title },
          { label: "Words", value: fmtNum(proof.words) },
          { label: "Tone", value: TONES[proof.tone] ?? "—" },
          { label: "Sources", value: String(proof.sources) },
          { label: "Date", value: fmtDate(proof.at) },
          {
            label: "Author",
            value: (
              <a className="mono" href={CONFIG.explorerAddress(proof.author)} target="_blank" rel="noopener noreferrer" title={proof.author}>
                {shortAddr(proof.author)}
              </a>
            ),
          },
          { label: "Fingerprint", value: <span className="mono">{`${proof.textHash.slice(0, 10)}…${proof.textHash.slice(-6)}`}</span>, title: proof.textHash },
        ]}
        total={{ label: "Status", value: "✓ Verified on-chain" }}
      >
        <button type="button" className="btn btn-secondary btn-block" onClick={async () => (await copyText(proofLink(proof.id))) && toast("Proof link copied")}>
          Copy proof link
        </button>
        <a className="btn btn-primary btn-block" style={{ marginTop: 8 }} href={txHash ? CONFIG.explorerTx(txHash) : CONFIG.explorerAddress(CONFIG.CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer">
          View on explorer ↗
        </a>
        {!!versions && versions.length > 1 && (
          <div className="versions">
            Versions:{" "}
            {versions.map((id, i) => (
              <a key={id} className="chip chip-panel" href={proofLink(id)} target="_blank" rel="noopener noreferrer">
                v{i + 1} #{id}
              </a>
            ))}
          </div>
        )}
      </Receipt>
    </div>
  );
}
