"use client";
// App-wide UI context: toast + modal. Wallet lives in WalletProvider.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { WalletProvider } from "./WalletProvider";

type ModalAction<T> = { label: string; value: T; primary?: boolean };
type ModalOpts<T> = { title: string; text?: ReactNode; body?: ReactNode; actions: ModalAction<T>[] };

type UI = {
  toast: (msg: string, ms?: number) => void;
  ask: <T>(opts: ModalOpts<T>) => Promise<T | null>;
};

const UIContext = createContext<UI | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI outside Providers");
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modal, setModal] = useState<(ModalOpts<unknown> & { resolve: (v: unknown) => void }) | null>(null);

  const toast = useCallback((msg: string, ms = 2500) => {
    setToastMsg(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), ms);
  }, []);

  const ask = useCallback(<T,>(opts: ModalOpts<T>) => new Promise<T | null>((resolve) => setModal({ ...(opts as ModalOpts<unknown>), resolve: resolve as (v: unknown) => void })), []);

  return (
    <UIContext.Provider value={{ toast, ask }}>
      <WalletProvider toast={toast}>{children}</WalletProvider>
      <div className={`toast${toastMsg ? " show" : ""}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
      {modal && (
        <Modal
          {...modal}
          close={(v) => {
            modal.resolve(v);
            setModal(null);
          }}
        />
      )}
    </UIContext.Provider>
  );
}

function Modal({ title, text, body, actions, close }: ModalOpts<unknown> & { close: (v: unknown) => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(null);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [close]);
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && close(null)}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title" tabIndex={-1} ref={titleRef}>
          {title}
        </h3>
        {text && <p>{text}</p>}
        {body && <div className="modal-body">{body}</div>}
        <div className="modal-actions">
          {actions.map((a) => (
            <button key={a.label} type="button" className={`btn btn-sm ${a.primary ? "btn-primary" : "btn-secondary"}`} onClick={() => close(a.value)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
