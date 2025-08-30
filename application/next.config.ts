import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // Fixes Socket.IO dependencies
      fs: false,
      net: false,
      tls: false,
      dns: false,
    };
    return config;
  },
};

export default nextConfig;
