import { chromium } from "@playwright/test";
const [base, w, ...paths] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +w, height: 900 }, locale: "fa-IR" }); const p = await ctx.newPage();
await p.goto(base + "/login"); await p.getByRole("button", { name: /دانش‌آموز: سارا/ }).click(); await p.waitForURL(/dashboard/);
for (const path of paths) {
  await p.goto(base + path); await p.waitForLoadState("networkidle");
  const r = await p.evaluate(() => { const W = document.documentElement.clientWidth; return { over: document.documentElement.scrollWidth - W, els: [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > W + 1 || r.left < -1); }).slice(0, 6).map((e) => e.tagName + "." + String(e.className).slice(0, 70) + " " + Math.round(e.getBoundingClientRect().left) + ".." + Math.round(e.getBoundingClientRect().right)) }; });
  console.log(path, r.over, r.els.join("\n   "));
}
await b.close();
