import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Verify } from "@/components/Verify";

export const metadata: Metadata = { title: "Verify an article" };

export default function VerifyPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={<main className="page muted">Loading…</main>}>
        <Verify />
      </Suspense>
      <Footer />
    </>
  );
}
