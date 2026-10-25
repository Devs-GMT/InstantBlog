"use client";
// Stamp flow: connect → chain → fingerprint → confirm → tx → proof card. PRD P-2…P-7.
import type { Editor } from "@tiptap/react";
import { useState } from "react";
import { ChainError, proofsForHash, stamp, type Proof } from "@/lib/chain";
import { CONFIG, contractConfigured } from "@/lib/config";
import { docTitle, getMarkdown } from "@/lib/editorUtil";
import { fingerprint, wordCount } from "@/lib/fingerprint";
import { cutBytes, fmtNum } from "@/lib/format";
import { usableSources } from "@/lib/brief";
import type { Draft } from "@/lib/store";
import { useUI } from "../Providers";
import { useWallet } from "../WalletProvider";

export type StampPhase = "idle" | "connect" | "wallet" | "pending" | "done";

export function useStamp({ editor, draft, onStamped }: { editor: Editor | null; draft: Draft | null; onStamped: (s: Draft["stamps"][number]) => void }) {
  const { toast, ask } = useUI();
  const wallet = useWallet();
  const [phase, setPhase] = useState<StampPhase>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [card, setCard] = useState<{ proof: Proof; txHash: string } | null>(null);

  const run = async () => {
    if (!editor || !draft || phase === "wallet" || phase === "pending") return;
    if (!contractConfigured()) return toast("Stamping isn't live yet — the contract address isn't set.");
    if (!wallet.hasProvider) {
      const go = await ask({
        title: "Install MetaMask to stamp",
        text: "Writing, editing and exports work without a wallet. Stamping needs MetaMask to sign the transaction.",
        actions: [
          { label: "Not now", value: false },
          { label: "Get MetaMask", value: true, primary: true },
        ],
      });
      if (go) window.open("https://metamask.io/download/", "_blank", "noopener");
      return;
    }
    setPhase("connect");
    try {
      const address = wallet.address || (await wallet.connect());
      if (!address) return;
      if (!wallet.onChain && !(await wallet.ensureChain())) return;

      const md = getMarkdown(editor);
      const words = wordCount(md);
      if (!words) return toast("Your article looks empty. Add some text first.");
      const hash = await fingerprint(md);
      const title = cutBytes(docTitle(editor) || draft.brief.topic.trim() || "Untitled article", CONFIG.LIMITS.titleBytes);

      const existing = await proofsForHash(hash).catch(() => [] as number[]);
      if (existing.length) {
        const again = await ask({
          title: "Already stamped",
          text: `This exact text is already stamped as #${existing[0]}. Stamp again?`,
          actions: [
            { label: "Cancel", value: false },
            { label: "Stamp again", value: true, primary: true },
          ],
        });
        if (!again) return;
      }

      const ok = await ask({
        title: "Stamp this version?",
        text: "Your title, word count and wallet address will be public on BOT Chain. The article text stays private.",
        body: (
          <div className="receipt-row" style={{ padding: 0 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
            <span className="muted">{fmtNum(words)} words</span>
          </div>
        ),
        actions: [
          { label: "Cancel", value: false },
          { label: "Stamp", value: true, primary: true },
        ],
      });
      if (!ok) return;

      const sources = usableSources(draft.brief).length;
      setPhase("wallet");
      const signer = await wallet.getSigner();
      const res = await stamp(signer, { hash, title, words, tone: draft.brief.tone, sources }, (tx) => {
        setTxHash(tx);
        setPhase("pending");
      });
      const at = Date.now();
      onStamped({ proofId: res.id, hash, txHash: res.txHash, at, words });
      setCard({ proof: { id: res.id, author: address, textHash: hash, title, words, tone: draft.brief.tone, sources, at }, txHash: res.txHash });
      setPhase("done");
      setTimeout(() => setPhase((p) => (p === "done" ? "idle" : p)), 4000);
      return;
    } catch (err) {
      toast(err instanceof ChainError ? err.message : "Stamp failed. Try again.");
    } finally {
      setPhase((p) => (p === "done" ? p : "idle"));
    }
  };

  return { phase, txHash, run, card, closeCard: () => setCard(null) };
}
