import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Build-time ESLint errors are ignored
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
