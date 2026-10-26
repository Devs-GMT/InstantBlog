import type { Metadata, Viewport } from "next";
import { Caveat, Inter, JetBrains_Mono, Newsreader, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/Providers";
import { CONFIG } from "@/lib/config";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/print.css";

const nunito = Nunito({ subsets: ["latin"], weight: ["600", "700"], variable: "--ff-nunito", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--ff-inter", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "600"], variable: "--ff-newsreader", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: ["600"], variable: "--ff-hand", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--ff-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(CONFIG.SITE_URL),
  title: { default: "InstantBlog: write a sourced article in minutes", template: "%s · InstantBlog" },
  description:
    "Pick a topic, a tone and your key points. InstantBlog drafts a sourced article with citations. Copy it or download PDF or Word, then stamp a timestamped proof on BOT Chain.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Write it once. Publish anywhere.",
    description: "Sourced articles from your brief, exported to PDF or Word and stamped on BOT Chain.",
    type: "website",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#F7FAFC" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${inter.variable} ${newsreader.variable} ${mono.variable} ${caveat.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
