// Genuine viewport screenshots of the running site for the portfolio mockup. Usage: node scripts/capture-portfolio.mjs [baseUrl]
import { chromium, devices } from "@playwright/test";
const base = process.argv[2] ?? "https://teachtech.shomaaa.ir";
const b = await chromium.launch();
async function shot(opts, url, out) {
  for (let i = 1; i <= 6; i++) {
    const ctx = await b.newContext({ ...opts, locale: "fa-IR", timezoneId: "Asia/Tehran", serviceWorkers: "block" }); const p = await ctx.newPage();
    try { await p.goto(base + url, { waitUntil: "load", timeout: 45000 }); await p.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1200); await p.screenshot({ path: out }); await ctx.close(); console.log("ok", out); return; }
    catch (e) { await ctx.close(); console.log("retry", i, String(e).slice(0, 80)); }
  }
  throw new Error("failed " + url);
}
await shot({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, "/", "screenshots/portfolio/hero-desktop.png");
await shot({ ...devices["Pixel 5"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, "/", "screenshots/portfolio/hero-mobile.png");
await b.close();
