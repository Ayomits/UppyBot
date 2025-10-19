import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ hostname: "**", pathname: "**" }],
  },
};

export default nextConfig;
