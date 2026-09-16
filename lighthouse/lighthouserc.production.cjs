module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: [
        "https://dashboard.vvbb.fr/fr",
        "https://dashboard.vvbb.fr/fr/login",
        "https://dashboard.vvbb.fr/fr/signup",
      ],
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
  },
};
