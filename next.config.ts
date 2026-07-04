// next.config.ts

import type { NextConfig } from "next";

if (process.env.NODE_ENV !== "production") {
  import("@opennextjs/cloudflare").then((mod) => mod.initOpenNextCloudflareForDev());
}

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
