import type { NextConfig } from "next";
import { resolve } from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readSync } = require("jsonc") as typeof import("jsonc");

const config = readSync(resolve(__dirname, "../config.jsonc")) as {
  frontend: number;
  backend: number;
  realDataDays: number;
  predOutputDays: number;
  overlapDays: number;
};

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_DEFAULT_REAL_DATA_DAYS: String(config.realDataDays),
    NEXT_PUBLIC_DEFAULT_PRED_OUTPUT_DAYS: String(config.predOutputDays),
    NEXT_PUBLIC_DEFAULT_OVERLAP_DAYS: String(config.overlapDays),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://localhost:${config.backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;