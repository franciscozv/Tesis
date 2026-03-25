import type { NextConfig } from 'next';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Evita que Next detecte un root incorrecto por lockfiles fuera del repo
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
