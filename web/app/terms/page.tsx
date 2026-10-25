import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <StaticPage title="Terms">
      <p>InstantBlog is provided as-is, without warranties. You&apos;re responsible for what you publish.</p>
      <p>AI can be wrong. Check facts and citations before publishing, and respect the copyright of your sources.</p>
      <p>Stamping is a public, permanent blockchain transaction paid from your own wallet. It can&apos;t be undone.</p>
    </StaticPage>
  );
}
