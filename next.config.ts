import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the repository's concise, product-specific AGENTS.md authoritative.
  agentRules: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
