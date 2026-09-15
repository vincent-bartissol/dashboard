import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/better-sqlite3/**/*", "./lib/db/migrations/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.paris.fr" },
      { protocol: "https", hostname: "opendata.paris.fr" },
    ],
  },
};

export default withNextIntl(nextConfig);
