import { expect, test } from "@playwright/test";
import { noConsoleErrors } from "./helpers";

test("homepage renders brand, hero, featured courses with no console errors", async ({ page }) => {
  const check = noConsoleErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ریاضی را بفهمید");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("link", { name: "مشاهدهٔ دوره‌ها" }).first()).toBeVisible();
  await expect(page.getByText("از کجا شروع کنیم؟")).toBeVisible();
  await page.waitForTimeout(500);
  check();
});

test("catalog: search, filters, sorting and empty state work against local data", async ({ page }) => {
  await page.goto("/courses");
  const count = page.getByRole("status").filter({ hasText: "دوره پیدا شد" });
  await expect(count).toContainText("۱۶");
  await page.getByPlaceholder("نام دوره یا مبحث…").fill("حسابان");
  await expect(page).toHaveURL(/q=/);
  await expect(count).not.toContainText("۱۶");
  await page.getByPlaceholder("نام دوره یا مبحث…").fill("");
  await page.getByLabel("پایهٔ تحصیلی").selectOption("12");
  await expect(page.locator("article").first()).toBeVisible();
  await page.getByLabel("مرتب‌سازی:").selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);
  await page.waitForTimeout(500);
  const prices = await page.locator("article .tabular.font-bold").allTextContents();
  const nums = prices.map((t) => Number(t.replace(/[^\d۰-۹]/g, "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))));
  expect(nums).toEqual([...nums].sort((a, b) => a - b));
  await page.getByPlaceholder("نام دوره یا مبحث…").fill("فیزیک کوانتوم");
  await expect(page.getByText("دوره‌ای با این فیلترها پیدا نشد")).toBeVisible();
  await page.getByRole("button", { name: "پاک‌کردن فیلترها" }).first().click();
  await expect(count).toContainText("۱۶");
});

test("course detail: curriculum, preview lessons, price, unknown slug 404", async ({ page }) => {
  await page.goto("/courses/calculus-12-limit-derivative");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("حسابان دوازدهم");
  await expect(page.getByText("سرفصل‌ها")).toBeVisible();
  await expect(page.getByText("پیش‌نمایش رایگان").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "افزودن به سبد خرید" }).first()).toBeVisible();
  const res = await page.goto("/courses/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("instructor profile, about, faq, resources, contact validation, verify page", async ({ page }) => {
  await page.goto("/instructors/amir-kavian");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("امیر کاویان");
  await expect(page.getByText("دوره‌های موجود")).toBeVisible();
  await page.goto("/faq", { waitUntil: "domcontentloaded" }); await expect(page.getByText("سؤالات متداول").first()).toBeVisible();
  await page.goto("/resources/how-to-study-limits"); await expect(page.locator(".katex").first()).toBeVisible();
  await page.goto("/contact");
  await page.getByRole("button", { name: "آماده‌سازی پیام" }).click();
  await expect(page.getByText("ایمیل معتبر وارد کنید.")).toBeVisible();
  await page.goto("/verify/TT-NOPE1234");
  await expect(page.getByText("گواهی‌ای با این شناسه پیدا نشد")).toBeVisible();
});

test("search results page finds courses", async ({ page }) => {
  await page.goto("/search?q=کنکور");
  await expect(page.locator("article").first()).toContainText("کنکور");
});
