const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Ensure Turbopack resolves from frontend folder in a monorepo-ish layout.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
