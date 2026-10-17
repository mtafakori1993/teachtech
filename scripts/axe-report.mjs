import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const base = process.argv[2] ?? "http://localhost:3712";
const paths = process.argv.slice(3);
const b = await chromium.launch(); const p = await (await b.newContext({ locale: "fa-IR" })).newPage();
for (const path of paths) {
  await p.goto(base + path); await p.waitForLoadState("networkidle");
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  console.log("==", path);
  for (const v of r.violations) console.log(`${v.impact} ${v.id} (${v.nodes.length}) :: ${v.help}\n   ${v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " | " + (n.failureSummary ?? "").split("\n")[1]).join("\n   ")}`);
}
await b.close();
