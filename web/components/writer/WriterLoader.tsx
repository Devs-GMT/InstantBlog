"use client";
// The editor needs window/DOM, so the writer renders only in the browser.
import dynamic from "next/dynamic";

const Writer = dynamic(() => import("./Writer"), {
  ssr: false,
  loading: () => <div className="page muted">Loading the writer…</div>,
});

export function WriterLoader() {
  return <Writer />;
}
