import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the repository's concise, product-specific AGENTS.md authoritative.
  agentRules: false,
};

export default nextConfig;
