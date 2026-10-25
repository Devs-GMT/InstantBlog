import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <StaticPage title="Privacy">
      <p>Drafts are saved only in your browser (localStorage). There are no accounts and no server-side draft storage.</p>
      <p>
        To draft and edit, the text you send (your brief, source text and selected passages) goes through our server to Google&apos;s Gemini API. We
        don&apos;t store or log that text. InstantBlog uses Gemini&apos;s free tier, where Google may use inputs and outputs to improve its products
        and human reviewers may read them. Don&apos;t paste anything confidential into a brief.
      </p>
      <p>
        To read a source link, our server fetches that public page on your behalf. Stamping publishes a fingerprint (SHA-256), the title, the word count,
        tone, number of sources and your wallet address on a public blockchain, permanently.
      </p>
    </StaticPage>
  );
}
