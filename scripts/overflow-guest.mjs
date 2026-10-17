import { chromium } from "@playwright/test";
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 360, height: 900 }, locale: "fa-IR" })).newPage();
await p.goto("http://localhost:3712/"); await p.waitForLoadState("networkidle");
console.log(await p.evaluate(() => { const W = document.documentElement.clientWidth; return document.documentElement.scrollWidth - W + " :: " + [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > W + 1 || r.left < -1); }).slice(0, 5).map((e) => e.tagName + "." + String(e.className).slice(0, 60) + " " + Math.round(e.getBoundingClientRect().left) + ".." + Math.round(e.getBoundingClientRect().right)).join("\n"); }));
await b.close();
