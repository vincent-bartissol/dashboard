/**
 * @param {import("puppeteer").Browser} browser
 */
module.exports = async (browser) => {
  const value = process.env.LHCI_SESSION_COOKIE;
  if (!value) {
    throw new Error("LHCI_SESSION_COOKIE is not set");
  }

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());
  await page.setCookie({
    name: "better-auth.session_token",
    value,
    url: "http://localhost:3000",
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
  });
};
