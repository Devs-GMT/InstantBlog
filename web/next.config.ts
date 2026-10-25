import type { NextConfig } from "next";

// Static export (served by Vercel): every route becomes <route>/index.html. No server features needed.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
