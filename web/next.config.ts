import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app so Next does not pick up a stray
  // package-lock.json from a parent directory.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
