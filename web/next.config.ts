import type { NextConfig } from "next";

// Static export for GitHub Pages: every route becomes <route>/index.html.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
