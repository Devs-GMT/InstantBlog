import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Guides" };

export default function Guides() {
  return (
    <StaticPage title="Guides" lead="Short tips for getting the best drafts out of InstantBlog.">
      <h2 id="how-to">How to write a how-to</h2>
      <p>Choose the How-to guide type and write each key point as a step (&quot;Install the wallet&quot;, &quot;Get test tokens&quot;, &quot;Deploy&quot;). Link the official docs as sources so commands and numbers are cited.</p>
      <h2 id="citing">Citing sources</h2>
      <p>Add up to 5 links. Facts, numbers and quotes in the draft come from them and carry [n] markers that match the source numbers. If a page can&apos;t be read, paste its text instead. Hover a citation to see which source it points to.</p>
      <h2 id="tone">Choosing a tone</h2>
      <p>Friendly and Casual suit blogs and newsletters; Professional suits company updates; Academic suits essays; Witty and Inspiring work for opinion pieces and launch posts. You can change the tone of any passage later with &quot;Change tone&quot;.</p>
      <h2 id="word">Export to Word</h2>
      <p>Click .docx in the top bar. Headings, lists, links and quotes become real Word styles, so the navigation pane and table of contents work.</p>
    </StaticPage>
  );
}
