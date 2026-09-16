module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        "http://localhost:3000/fr",
        "http://localhost:3000/fr/login",
        "http://localhost:3000/fr/signup",
      ],
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
  },
};
