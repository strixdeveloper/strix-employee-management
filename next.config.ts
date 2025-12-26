import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Exclude Puppeteer packages from bundling for serverless compatibility
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
};

export default nextConfig;
