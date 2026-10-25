"use client";
// MetaMask connect + BOT Chain switch/add. PRD W-1…W-5.
import { BrowserProvider, type Signer } from "ethers";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CONFIG } from "@/lib/config";

type Eth = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, fn: (...args: never[]) => void) => void;
  removeListener?: (event: string, fn: (...args: never[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eth;
  }
}

type Wallet = {
  ready: boolean;
  hasProvider: boolean;
  address: string | null;
  onChain: boolean;
  connect: () => Promise<string | null>;
  ensureChain: () => Promise<boolean>;
  disconnect: () => void;
  getSigner: () => Promise<Signer>;
};

const WalletContext = createContext<Wallet | null>(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet outside WalletProvider");
  return ctx;
}

const DISCONNECTED = "ib.disconnected";
const lsGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const lsSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

export function WalletProvider({ children, toast }: { children: ReactNode; toast: (m: string) => void }) {
  const [ready, setReady] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  useEffect(() => {
    const eth = window.ethereum;
    setHasProvider(!!eth);
    if (!eth) {
      setReady(true);
      return;
    }
    const onAccounts = (accs: string[]) => setAddress(accs[0] ?? null);
    const onChainChanged = (id: string) => setChainId(id);
    (async () => {
      try {
        const [accs, id] = (await Promise.all([eth.request({ method: "eth_accounts" }), eth.request({ method: "eth_chainId" })])) as [string[], string];
        if (lsGet(DISCONNECTED) !== "1") setAddress(accs[0] ?? null);
        setChainId(id);
      } catch {
        /* ignore */
      }
      setReady(true);
    })();
    eth.on?.("accountsChanged", onAccounts as (...a: never[]) => void);
    eth.on?.("chainChanged", onChainChanged as (...a: never[]) => void);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts as (...a: never[]) => void);
      eth.removeListener?.("chainChanged", onChainChanged as (...a: never[]) => void);
    };
  }, []);

  const ensureChain = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return false;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CONFIG.CHAIN.chainId }] });
    } catch (err) {
      const e = err as { code?: number; message?: string; data?: { originalError?: { code?: number } } };
      const code = e?.code ?? e?.data?.originalError?.code;
      if (code === 4902 || /unrecognized chain/i.test(e?.message || "")) {
        try {
          await eth.request({ method: "wallet_addEthereumChain", params: [CONFIG.CHAIN] });
        } catch {
          toast("Couldn't add BOT Chain to MetaMask.");
          return false;
        }
      } else {
        if (code === 4001) toast("Network switch cancelled.");
        return false;
      }
    }
    const id = (await eth.request({ method: "eth_chainId" })) as string;
    setChainId(id);
    return id === CONFIG.CHAIN.chainId;
  }, [toast]);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) {
      window.open("https://metamask.io/download/", "_blank", "noopener");
      return null;
    }
    try {
      const accs = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const a = accs[0] ?? null;
      setAddress(a);
      lsSet(DISCONNECTED, "0");
      const id = (await eth.request({ method: "eth_chainId" })) as string;
      setChainId(id);
      if (id !== CONFIG.CHAIN.chainId) await ensureChain();
      return a;
    } catch (err) {
      toast((err as { code?: number })?.code === 4001 ? "Connection cancelled." : "Couldn't connect to MetaMask.");
      return null;
    }
  }, [ensureChain, toast]);

  const disconnect = useCallback(() => {
    setAddress(null);
    lsSet(DISCONNECTED, "1");
    toast("Disconnected in this app. Use MetaMask to fully disconnect.");
  }, [toast]);

  const getSigner = useCallback(async () => {
    if (!window.ethereum) throw new Error("No wallet");
    return new BrowserProvider(window.ethereum as never).getSigner();
  }, []);

  const value = useMemo<Wallet>(
    () => ({ ready, hasProvider, address, onChain: chainId === CONFIG.CHAIN.chainId, connect, ensureChain, disconnect, getSigner }),
    [ready, hasProvider, address, chainId, connect, ensureChain, disconnect, getSigner],
  );
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
