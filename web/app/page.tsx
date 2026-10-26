import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Wind } from "@/components/home/Wind";
import { Audience, ClosingCta, Faq, Features, Hero, HowItWorks, Problem, ProofSection } from "@/components/home/Sections";

export default function Home() {
  return (
    <>
      <Wind />
      <Nav />
      <main>
        <Hero />
        <Audience />
        <Problem />
        <HowItWorks />
        <Features />
        <ProofSection />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
