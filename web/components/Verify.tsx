"use client";
// /verify — paste a copy → match proofs; ?proof=N → proof card. No wallet needed. PRD V-1…V-5.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChainError, getProof, proofsForHash, type Proof } from "@/lib/chain";
import { fingerprint } from "@/lib/fingerprint";
import { fmtDate, shortAddr } from "@/lib/format";
import { ProofCard } from "./ProofCard";

type Result =
  | { kind: "match"; proof: Proof; others: number[] }
  | { kind: "none" }
  | { kind: "error"; message: string };

export function Verify() {
  const params = useSearchParams();
  const proofParam = params.get("proof");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [card, setCard] = useState<{ proof?: Proof; error?: string; loading?: boolean } | null>(null);

  useEffect(() => {
    if (proofParam === null) return setCard(null);
    if (!/^\d{1,12}$/.test(proofParam) || Number(proofParam) < 1) return setCard({ error: "That proof link looks broken." });
    setCard({ loading: true });
    getProof(Number(proofParam))
      .then((proof) => setCard({ proof }))
      .catch((e: ChainError) => setCard({ error: e.code === "not_found" ? "Proof not found. Check the link and try again." : e.message }));
  }, [proofParam]);

  const verify = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const hash = await fingerprint(text);
      const ids = await proofsForHash(hash);
      if (!ids.length) setResult({ kind: "none" });
      else setResult({ kind: "match", proof: await getProof(Math.min(...ids)), others: ids.filter((i) => i !== Math.min(...ids)) });
    } catch (e) {
      setResult({ kind: "error", message: e instanceof ChainError ? e.message : "Couldn't reach BOT Chain. Try again in a moment." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <h1>Verify an article</h1>
      <p className="lead">Paste any copy of an article. We&apos;ll check its fingerprint against proofs on BOT Chain — nothing you paste leaves your browser.</p>

      {card && (
        <div className="proof-view">
          {card.loading && <p className="muted">Loading proof #{proofParam}…</p>}
          {card.error && <div className="result result-err">{card.error}</div>}
          {card.proof && <ProofCard proof={card.proof} />}
        </div>
      )}

      <div className="card verify-box">
        <label className="label" htmlFor="verify-text">
          Article text <span className="helper">Markdown or plain text</span>
        </label>
        <textarea id="verify-text" className="textarea" placeholder="Paste the article text (Markdown or plain text)" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="button" className="btn btn-primary btn-lg" onClick={verify} disabled={!text.trim() || busy}>
          {busy && <span className="spinner" />} Verify
        </button>
        {result?.kind === "match" && (
          <div className="result result-ok" role="status">
            <strong>
              ✓ Matches proof #{result.proof.id} by {shortAddr(result.proof.author)}, stamped {fmtDate(result.proof.at)}
            </strong>
            {result.others.length > 0 && <span>Also stamped as {result.others.map((i) => `#${i}`).join(", ")}</span>}
            <Link href={`/verify/?proof=${result.proof.id}`} className="text-link">
              Open proof card →
            </Link>
          </div>
        )}
        {result?.kind === "none" && (
          <div className="result result-no" role="status">
            <strong>No proof for this exact text.</strong>
            <span className="muted">One changed character changes the fingerprint.</span>
          </div>
        )}
        {result?.kind === "error" && (
          <div className="result result-err" role="alert">
            {result.message}
          </div>
        )}
      </div>
    </main>
  );
}
