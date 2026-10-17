import { chromium, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const b = await chromium.launch(); const p = await (await b.newContext({ ...devices["Pixel 5"], viewport: { width: 390, height: 844 }, locale: "fa-IR" })).newPage();
await p.goto("http://localhost:3712/login"); await p.getByRole("button", { name: /دانش‌آموز: سارا/ }).click(); await p.waitForURL(/dashboard/);
for (const path of process.argv.slice(2)) {
  await p.goto("http://localhost:3712" + path); await p.waitForLoadState("networkidle");
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  console.log("==", path);
  for (const v of r.violations) console.log(`${v.impact} ${v.id} (${v.nodes.length}) :: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " | " + (n.failureSummary ?? "").split("\n")[1]).join("\n   ")}`);
}
await b.close();
