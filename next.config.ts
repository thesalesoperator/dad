import type { NextConfig } from "next";

const isMobile = process.env.NEXT_PUBLIC_MOBILE === 'true';

const nextConfig: NextConfig = {
  // Static export for Capacitor mobile builds; SSR for web
  ...(isMobile && {
    output: 'export',
    images: { unoptimized: true },
  }),
};

export default nextConfig;
