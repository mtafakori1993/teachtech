import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginAs } from "./helpers";

const WIDTHS = [360, 390, 430, 768, 1024, 1440];
const PUBLIC = ["/", "/courses", "/courses/calculus-12-limit-derivative", "/instructors/amir-kavian", "/cart", "/login", "/faq", "/contact"];

for (const w of WIDTHS) {
  test(`no horizontal overflow at ${w}px on public pages`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    for (const p of PUBLIC) {
      await page.goto(p);
      await page.waitForLoadState("networkidle");
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over, `${p} @${w}`).toBeLessThanOrEqual(1);
    }
  });
  test(`no horizontal overflow at ${w}px in dashboards, learn, quiz`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await loginAs(page, "student");
    for (const p of ["/dashboard", "/dashboard/courses", "/dashboard/calendar", "/dashboard/quizzes", "/learn/math-11-functions-limits?lesson=c03-l1", "/quiz/q-c14-final"]) {
      await page.goto(p); await page.waitForLoadState("networkidle");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${p} @${w}`).toBeLessThanOrEqual(1);
    }
  });
}

test("mobile navigation: menu sheet, bottom nav and tap-target sizes", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "ناوبری پایین" })).toBeVisible();
  await page.getByRole("button", { name: "باز کردن منو" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("link", { name: "دوره‌ها" }).click();
  await expect(page).toHaveURL(/\/courses/);
  await page.getByRole("button", { name: /فیلترها/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("header button, header a, nav[aria-label='ناوبری پایین'] a")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 32 || r.height < 32); }).map((e) => e.outerHTML.slice(0, 80)));
  expect(small).toEqual([]);
});

test.describe("accessibility (axe, WCAG A/AA)", () => {
  const run = async (page: import("@playwright/test").Page, path: string) => {
    await page.goto(path); await page.waitForLoadState("networkidle");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  };
  for (const p of ["/", "/courses", "/courses/calculus-12-limit-derivative", "/login", "/cart", "/faq", "/install"]) test(`public ${p}`, async ({ page }) => { await run(page, p); });
  test("student pages", async ({ page }) => { await loginAs(page, "student"); for (const p of ["/dashboard", "/dashboard/courses", "/dashboard/quizzes", "/learn/math-11-functions-limits?lesson=c03-l1", "/quiz/q-c14-final"]) await run(page, p); });
});
