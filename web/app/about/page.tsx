import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <StaticPage title="About InstantBlog" lead="An AI blog and article writer that stays honest about its facts.">
      <p>
        You give InstantBlog a topic, a tone, 3–5 key points and your source links. It reads the sources and drafts a structured article where facts come
        only from those sources, each with a [1][2] citation. You polish it with AI helpers, export it, and can stamp a proof of authorship on BOT Chain.
      </p>
      <h2>What a proof means</h2>
      <p>
        A proof shows who stamped this exact text and when — not that they wrote every word without AI. InstantBlog is an AI-assisted writing tool:
        always check your facts before publishing.
      </p>
      <p>
        <Link href="/write/" className="btn btn-primary">Write my first post</Link>
      </p>
    </StaticPage>
  );
}
