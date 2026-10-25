"use client";
// /posts — drafts in this browser + proofs stamped by the connected wallet. PRD M-2, M-3.
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProof, proofsOf, type Proof } from "@/lib/chain";
import { contractConfigured, TONES } from "@/lib/config";
import { fmtDate, fmtNum, timeAgo } from "@/lib/format";
import { duplicateDraft, store, type Draft } from "@/lib/store";
import { useUI } from "./Providers";
import { useWallet } from "./WalletProvider";

export function Posts() {
  const { ask, toast } = useUI();
  const wallet = useWallet();
  const [tab, setTab] = useState<"drafts" | "proofs">("drafts");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [proofs, setProofs] = useState<Proof[] | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(store.drafts());
    if (!store.available) toast("Couldn't save in this browser — export to keep your work.", 4000);
  }, [toast]);

  useEffect(() => {
    if (tab !== "proofs" || !wallet.address || !contractConfigured()) return;
    setProofs(null);
    setProofError(null);
    proofsOf(wallet.address)
      .then((ids) => Promise.all([...ids].reverse().map((id) => getProof(id))))
      .then(setProofs)
      .catch((e) => setProofError(e.message));
  }, [tab, wallet.address]);

  const remove = async (d: Draft) => {
    const ok = await ask({
      title: `Delete "${d.title || d.brief.topic || "Untitled draft"}"?`,
      text: "This can't be undone.",
      actions: [
        { label: "Cancel", value: false },
        { label: "Delete", value: true, primary: true },
      ],
    });
    if (!ok) return;
    store.deleteDraft(d.id);
    setDrafts(store.drafts());
  };

  const duplicate = (d: Draft) => {
    store.saveDraft(duplicateDraft(d));
    setDrafts(store.drafts());
    toast("Draft duplicated");
  };

  return (
    <main className="page">
      <h1>My posts</h1>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "drafts"} onClick={() => setTab("drafts")}>
          Drafts in this browser
        </button>
        <button type="button" role="tab" aria-selected={tab === "proofs"} onClick={() => setTab("proofs")}>
          Stamped on BOT Chain
        </button>
      </div>

      {tab === "drafts" && (
        <div className="post-list">
          {drafts.length === 0 && (
            <div className="card empty">
              <p>No drafts yet.</p>
              <Link href="/write/?new=1" className="btn btn-primary">
                Write my first post
              </Link>
            </div>
          )}
          {drafts.map((d) => {
            const last = d.stamps.at(-1);
            return (
              <div className="card post-row" key={d.id}>
                <div style={{ minWidth: 0 }}>
                  <h3>{d.title || d.brief.topic || "Untitled draft"}</h3>
                  <div className="post-meta">
                    <span>{timeAgo(d.updatedAt)}</span>
                    <span>{fmtNum(d.words || 0)} words</span>
                    {last ? <span className="chip chip-green">Stamped #{last.proofId}</span> : <span className="chip chip-panel">Draft</span>}
                  </div>
                </div>
                <div className="post-actions">
                  <Link href={`/write/?id=${d.id}`} className="btn btn-secondary btn-xs" onClick={() => store.setCurrent(d.id)}>
                    Open
                  </Link>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => duplicate(d)}>
                    Duplicate
                  </button>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => remove(d)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {drafts.length > 0 && (
            <Link href="/write/?new=1" className="btn btn-secondary" style={{ justifySelf: "start", marginTop: 8 }}>
              + New draft
            </Link>
          )}
        </div>
      )}

      {tab === "proofs" && (
        <div className="post-list">
          {!wallet.address && (
            <div className="card empty">
              <p>Connect your wallet to see the articles you&apos;ve stamped.</p>
              <button type="button" className="btn btn-primary" onClick={wallet.connect}>
                {wallet.hasProvider ? "Connect wallet" : "Install MetaMask"}
              </button>
            </div>
          )}
          {wallet.address && !contractConfigured() && <div className="card empty">Stamping isn&apos;t live yet.</div>}
          {wallet.address && proofError && <div className="result result-err">{proofError}</div>}
          {wallet.address && contractConfigured() && !proofs && !proofError && <p className="muted">Loading proofs…</p>}
          {proofs?.length === 0 && <div className="card empty">No stamped articles for this wallet yet.</div>}
          {proofs?.map((p) => (
            <div className="card post-row" key={p.id}>
              <div style={{ minWidth: 0 }}>
                <h3>{p.title}</h3>
                <div className="post-meta">
                  <span className="chip chip-green">#{p.id}</span>
                  <span>{fmtDate(p.at)}</span>
                  <span>{fmtNum(p.words)} words</span>
                  <span>{TONES[p.tone]}</span>
                </div>
              </div>
              <div className="post-actions">
                <Link href={`/verify/?proof=${p.id}`} className="btn btn-secondary btn-xs">
                  Proof card
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
