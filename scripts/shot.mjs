// Usage: node scripts/shot.mjs <url> <out.png> [width] [height] [fullPage=1] [role]
import { chromium } from "@playwright/test";
const [url, out, w = "1440", h = "900", full = "1", role = ""] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, locale: "fa-IR", timezoneId: "Asia/Tehran", deviceScaleFactor: 1 });
const p = await ctx.newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
if (role) await p.addInitScript((r) => { try { const k = "teachtech.state"; localStorage.removeItem(k); sessionStorage.setItem("tt-role", r); } catch {} }, role);
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(600);
await p.screenshot({ path: out, fullPage: full === "1" });
console.log(errs.length ? "CONSOLE ERRORS:\n" + errs.join("\n") : "no console errors");
await b.close();
