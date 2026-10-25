// The ONLY place for site / chain / API constants. See docs/ARCHITECTURE.md §6.
// NEXT_PUBLIC_* env vars (set at build time) override the defaults below.

export type ChainParams = {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

const MAINNET: ChainParams = {
  chainId: "0x2a5", // 677
  chainName: "BOT Chain",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 }, // TODO confirm symbol on botchain.ai
  rpcUrls: ["https://rpc.botchain.ai"],
  blockExplorerUrls: ["https://scan.botchain.ai"],
};

const TESTNET: ChainParams = {
  chainId: "0x3c8", // 968
  chainName: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: ["https://rpc.bohr.life"],
  blockExplorerUrls: ["https://scan.bohr.life"],
};

const ZERO = "0x0000000000000000000000000000000000000000";

const CONTRACTS = {
  mainnet: process.env.NEXT_PUBLIC_CONTRACT_MAINNET || ZERO, // set NEXT_PUBLIC_CONTRACT_MAINNET after the mainnet deploy
  testnet: process.env.NEXT_PUBLIC_CONTRACT_TESTNET || "0x4625aF5b93bB0C53Af096E34005b9E32Cb61F72a", // BOT Chain testnet 968
};

// Until a mainnet address exists, the app runs on the live testnet contract (instead of a zero address).
const USE_TESTNET = process.env.NEXT_PUBLIC_USE_TESTNET === "1" || CONTRACTS.mainnet.toLowerCase() === ZERO;

const CHAIN = USE_TESTNET ? TESTNET : MAINNET;
const EXPLORER = CHAIN.blockExplorerUrls[0];
const DEV = process.env.NODE_ENV === "development";
// Vercel exposes the production domain to Next builds automatically (system env var).
const VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

export const CONFIG = {
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || (DEV ? "http://localhost:5173" : VERCEL_URL ? `https://${VERCEL_URL}` : "https://instantblog.vercel.app"),
  /** API lives in this Next app (/api/*). Override only to point a local build at another deployment. */
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || "",
  USE_TESTNET,
  CHAIN,
  CHAIN_ID_NUM: parseInt(CHAIN.chainId, 16),
  CONTRACT_ADDRESS: USE_TESTNET ? CONTRACTS.testnet : CONTRACTS.mainnet,
  BOTCHAIN_URL: "https://botchain.ai",
  GITHUB_URL: "https://github.com/Devs-GMT/InstantBlog",
  explorerAddress: (a: string) => `${EXPLORER}/address/${a}`,
  explorerTx: (h: string) => `${EXPLORER}/tx/${h}`,
  READING_WPM: 238,
  LIMITS: { minPoints: 3, maxPoints: 5, sources: 5, titleBytes: 160, pasteWords: 3000 },
} as const;

export const contractConfigured = () => CONFIG.CONTRACT_ADDRESS.toLowerCase() !== ZERO;

export const TONES = ["Friendly", "Professional", "Witty", "Inspiring", "Academic", "Casual"] as const;

export type DocType = "blog" | "article" | "howto" | "listicle" | "opinion";
export type Length = "short" | "medium" | "long";

export const TYPES: [DocType, string][] = [
  ["blog", "Blog post"],
  ["article", "Article"],
  ["howto", "How-to guide"],
  ["listicle", "Listicle"],
  ["opinion", "Opinion"],
];

export const LENGTHS: [Length, string, string][] = [
  ["short", "Short", "~500"],
  ["medium", "Medium", "~900"],
  ["long", "Long", "~1,400"],
];
