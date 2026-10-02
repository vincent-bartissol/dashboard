import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next emits inline/eval runtime scripts; a script-src hash would ignore 'unsafe-inline' (CSP2) and break the app.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "newrelic"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/better-sqlite3/**/*",
      "./node_modules/newrelic/**/*",
      "./lib/db/migrations/**/*",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.paris.fr" },
      { protocol: "https", hostname: "opendata.paris.fr" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim();

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG?.trim() || "self-bnv",
  project: process.env.SENTRY_PROJECT?.trim() || "paris-ouverte",
  authToken: sentryAuthToken,
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !sentryAuthToken,
  },
});
