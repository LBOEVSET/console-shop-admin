import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for GKE — minimal self-contained server, no node_modules copy needed.
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;
