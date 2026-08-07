import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
  allowedDevOrigins: [
    'carriable-superseriously-jovanni.ngrok-free.dev',
    'localhost:3000',
  ],
};

export default nextConfig;
