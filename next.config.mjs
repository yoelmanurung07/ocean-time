import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */
export default function nextConfig(phase) {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    allowedDevOrigins: [
      "127.0.0.1",
      "localhost",
      "*.ngrok-free.dev",
      "*.ngrok-free.app",
      "*.ngrok.io",
    ],
    turbopack: {
      root: import.meta.dirname,
    },
    experimental: {
      agentUpgrade: "security",
    },
  };
}
