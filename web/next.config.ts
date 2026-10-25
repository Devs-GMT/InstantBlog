import type { NextConfig } from "next";

// Runs on Vercel as a normal Next.js app: pages + /api route handlers (server/ holds the API logic).
const nextConfig: NextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  // Parsed/fetched at runtime on the server; keep them out of the bundle.
  serverExternalPackages: ["linkedom", "@mozilla/readability", "undici"],
};

export default nextConfig;
