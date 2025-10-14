import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ hostname: "**", pathname: "**" }],
  },
};
export default withBundleAnalyzer({
  enabled: true,
})(nextConfig);
