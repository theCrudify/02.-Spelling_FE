import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nonaktifkan floating Next.js dev indicator / icon melayang di development mode
  devIndicators: false,
  // Every page is per-user (session cookie), so plain dynamic rendering is used instead of cacheComponents.
  experimental: { serverActions: { bodySizeLimit: "210mb" } }, // one artwork file (setting file_max_mb, default 200 MB)
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
