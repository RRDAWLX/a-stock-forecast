import type { NextConfig } from "next";
import { resolve } from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readSync } = require("jsonc") as typeof import("jsonc");

const ports = readSync(resolve(__dirname, "../config.jsonc")) as {
  frontend: number;
  backend: number;
};

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://localhost:${ports.backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;