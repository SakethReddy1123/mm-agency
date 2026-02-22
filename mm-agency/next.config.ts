import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use current directory as Turbopack root to avoid multiple-lockfile warning in monorepos
  turbopack: { root: process.cwd() },
};

export default nextConfig;
