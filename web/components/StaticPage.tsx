import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

export function StaticPage({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <>
      <Nav />
      <main className="page legal">
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </main>
      <Footer />
    </>
  );
}
