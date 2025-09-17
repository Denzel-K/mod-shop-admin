import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        // For virtual-hosted style URLs like https://<bucket>.storage.googleapis.com/path
        hostname: '**.storage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
