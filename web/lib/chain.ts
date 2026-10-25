// Contract reads (public RPC, no wallet) and writes (MetaMask signer). docs/CONTRACT_SPEC.md.
import { Contract, Interface, JsonRpcProvider, type Signer } from "ethers";
import { CONFIG, contractConfigured } from "./config";

export const ABI = [
  "function stamp(bytes32 textHash, string title, uint32 words, uint8 tone, uint8 sources) returns (uint256 id)",
  "function getProof(uint256 id) view returns (tuple(address author, bytes32 textHash, string title, uint32 words, uint8 tone, uint8 sources, uint64 at))",
  "function proofsForHash(bytes32 textHash) view returns (uint256[])",
  "function proofsOf(address author) view returns (uint256[])",
  "function total() view returns (uint256)",
  "event Stamped(uint256 indexed id, address indexed author, bytes32 textHash, string title)",
  "error EmptyHash()",
  "error EmptyTitle()",
  "error TitleTooLong()",
  "error ZeroWords()",
  "error BadTone()",
  "error TooManySources()",
  "error UnknownProof()",
];

const iface = new Interface(ABI);

export type Proof = {
  id: number;
  author: string;
  textHash: string;
  title: string;
  words: number;
  tone: number;
  sources: number;
  at: number; // ms
};

export class ChainError extends Error {
  constructor(
    public code: "not_configured" | "not_found" | "rpc" | "rejected" | "no_gas" | "revert" | "failed",
    message: string,
  ) {
    super(message);
  }
}

let reader: Contract | null = null;
function readContract(): Contract {
  if (!contractConfigured()) throw new ChainError("not_configured", "The contract address isn't set yet.");
  if (!reader) {
    const provider = new JsonRpcProvider(CONFIG.CHAIN.rpcUrls[0], CONFIG.CHAIN_ID_NUM, { staticNetwork: true });
    reader = new Contract(CONFIG.CONTRACT_ADDRESS, ABI, provider);
  }
  return reader;
}

/** Read the tuple by index — on an ethers Result, `.at` is Array.prototype.at, not the field. */
function toProof(id: number, r: ArrayLike<unknown>): Proof {
  return {
    id,
    author: String(r[0]),
    textHash: String(r[1]),
    title: String(r[2]),
    words: Number(r[3]),
    tone: Number(r[4]),
    sources: Number(r[5]),
    at: Number(r[6]) * 1000,
  };
}

function errorName(err: unknown): string | null {
  const e = err as { revert?: { name?: string }; data?: unknown; info?: { error?: { data?: unknown } }; error?: { data?: unknown } };
  if (e?.revert?.name) return e.revert.name;
  const data = e?.data ?? e?.info?.error?.data ?? e?.error?.data;
  if (typeof data === "string" && data.startsWith("0x")) {
    try {
      return iface.parseError(data)?.name ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

const rpcError = () => new ChainError("rpc", "Couldn't reach BOT Chain. Try again in a moment.");

export async function getProof(id: number): Promise<Proof> {
  try {
    return toProof(id, await readContract().getProof(id));
  } catch (err) {
    if (err instanceof ChainError) throw err;
    if (errorName(err) === "UnknownProof" || (err as { code?: string })?.code === "CALL_EXCEPTION") {
      throw new ChainError("not_found", "Proof not found.");
    }
    throw rpcError();
  }
}

async function readIds(fn: "proofsForHash" | "proofsOf", arg: string): Promise<number[]> {
  try {
    const ids: bigint[] = await readContract()[fn](arg);
    return ids.map(Number);
  } catch (err) {
    if (err instanceof ChainError) throw err;
    throw rpcError();
  }
}

export const proofsForHash = (hash: string) => readIds("proofsForHash", hash);
export const proofsOf = (address: string) => readIds("proofsOf", address);

export async function total(): Promise<number> {
  try {
    return Number(await readContract().total());
  } catch (err) {
    if (err instanceof ChainError) throw err;
    throw rpcError();
  }
}

export type StampInput = { hash: string; title: string; words: number; tone: number; sources: number };

/** Send stamp() and wait. onSent(txHash) fires once broadcast. Returns { id, txHash }. */
export async function stamp(signer: Signer, input: StampInput, onSent?: (txHash: string) => void) {
  const c = new Contract(CONFIG.CONTRACT_ADDRESS, ABI, signer);
  let tx;
  try {
    tx = await c.stamp(input.hash, input.title, input.words, input.tone, input.sources);
  } catch (err) {
    throw mapWriteError(err);
  }
  onSent?.(tx.hash);
  let receipt;
  try {
    receipt = await tx.wait();
  } catch (err) {
    throw mapWriteError(err);
  }
  if (!receipt || receipt.status !== 1) throw new ChainError("failed", "Stamp failed. Try again.");
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "Stamped") return { id: Number(parsed.args.id), txHash: tx.hash as string };
    } catch {
      /* not our event */
    }
  }
  throw new ChainError("failed", "Stamp confirmed, but the proof id wasn't found in the receipt.");
}

const REVERT_MESSAGES: Record<string, string> = {
  TitleTooLong: "Title is too long to stamp (max 160 bytes). Shorten it and try again.",
  EmptyTitle: "Your article looks empty. Add some text first.",
  EmptyHash: "Your article looks empty. Add some text first.",
  ZeroWords: "Your article looks empty. Add some text first.",
  BadTone: "Something's off with the brief. Reload and try again.",
  TooManySources: "Something's off with the brief. Reload and try again.",
};

function mapWriteError(err: unknown): ChainError {
  const e = err as { code?: string | number; info?: { error?: { code?: number } }; message?: string; shortMessage?: string };
  const code = e?.code ?? e?.info?.error?.code;
  if (code === "ACTION_REJECTED" || code === 4001) return new ChainError("rejected", "Transaction cancelled.");
  if (code === "INSUFFICIENT_FUNDS" || /insufficient funds/i.test(e?.message || "")) {
    return new ChainError("no_gas", "You need a little BOT for gas.");
  }
  const name = errorName(err);
  if (name && REVERT_MESSAGES[name]) return new ChainError("revert", REVERT_MESSAGES[name]);
  console.warn("stamp failed:", e?.shortMessage || e?.message);
  return new ChainError("failed", "Stamp failed. Try again.");
}
