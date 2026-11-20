import type { NextConfig } from "next";

// @netlify/plugin-nextjs (OpenNext) doesn't support output: "standalone" — it bundles
// the app itself. Standalone output stays enabled only for local/non-Netlify builds.
const nextConfig: NextConfig = {
  ...(process.env.NETLIFY ? {} : { output: "standalone" as const }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
