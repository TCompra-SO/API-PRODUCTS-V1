import puppeteer, { Browser } from "puppeteer";

let browser: Browser | null = null;

export const getBrowser = async (): Promise<Browser> => {
  if (!browser) {
    browser = await puppeteer.launch({
      args: ["--no-sandbox"],
    });

    browser.on("disconnected", () => {
      browser = null;
    });
  }

  return browser;
};
