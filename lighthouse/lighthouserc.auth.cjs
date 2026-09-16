module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        "http://localhost:3000/fr/dashboard",
        "http://localhost:3000/fr/dashboard/velib",
      ],
      puppeteerScript: "./lighthouse/set-session-cookie.cjs",
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
        extraHeaders: {
          Cookie: `better-auth.session_token=${process.env.LHCI_SESSION_COOKIE ?? ""}`,
        },
      },
    },
  },
};
