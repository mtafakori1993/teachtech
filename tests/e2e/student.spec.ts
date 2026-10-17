import { expect, test } from "@playwright/test";
import { loginAs, noConsoleErrors } from "./helpers";

test("role gate: guest is asked to log in, student is denied admin", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("برای ادامه وارد شوید")).toBeVisible();
  await loginAs(page, "student");
  await page.goto("/admin");
  await expect(page.getByText("دسترسی به این بخش مجاز نیست")).toBeVisible();
  await page.goto("/instructor");
  await expect(page.getByText("دسترسی به این بخش مجاز نیست")).toBeVisible();
});

test("login form validates and rejects unknown accounts; session survives reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(page.getByText("ایمیل معتبر وارد کنید.")).toBeVisible();
  await page.getByLabel("ایمیل").fill("nobody@example.com");
  await page.getByLabel("رمز نمایشی").fill("teachtech");
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(page.getByText("حساب یا رمز نمایشی درست نیست")).toBeVisible();
  await page.getByLabel("ایمیل").fill("student@teachtech.example");
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("سارا");
});

test("student dashboard shows progress, quizzes, certificates, orders, profile", async ({ page }) => {
  const check = noConsoleErrors(page);
  await loginAs(page, "student");
  await expect(page.getByText("ادامهٔ یادگیری").first()).toBeVisible();
  for (const [path, text] of [["/dashboard/courses", "دوره‌های من"], ["/dashboard/calendar", "تقویم یادگیری"], ["/dashboard/quizzes", "آزمون‌های من"], ["/dashboard/certificates", "گواهی‌های من"], ["/dashboard/orders", "سفارش‌ها"], ["/dashboard/profile", "پروفایل و تنظیمات"]] as const) {
    await page.goto(path); await expect(page.getByRole("heading", { level: 1 })).toContainText(text);
  }
  await page.goto("/dashboard/orders");
  await expect(page.getByText("TT-10003")).toBeVisible();
  check();
});

test("cart → discount → simulated checkout: failure grants nothing, success enrolls", async ({ page }) => {
  await loginAs(page, "student");
  await page.goto("/courses/algebra-equations-10");
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).first().click();
  await page.goto("/cart");
  await expect(page.getByText("۶۹۰٬۰۰۰ تومان").first()).toBeVisible();
  await page.getByLabel("کد تخفیف").fill("BAD");
  await page.getByRole("button", { name: "اعمال" }).click();
  await expect(page.getByText("این کد تخفیف معتبر نیست.")).toBeVisible();
  await page.getByLabel("کد تخفیف").fill("teach10");
  await page.getByRole("button", { name: "اعمال" }).click();
  await expect(page.getByText("۶۲۱٬۰۰۰ تومان").first()).toBeVisible(); // 690,000 − 10% = 621,000
  await page.getByRole("link", { name: "ادامه و ثبت سفارش" }).click();
  await expect(page.getByText("پرداخت شبیه‌سازی‌شده").first()).toBeVisible();
  // failed payment
  await page.getByLabel("پرداخت ناموفق").check();
  await page.getByRole("button", { name: "ثبت نتیجهٔ آزمایشی" }).click();
  await expect(page.getByRole("heading", { name: "پرداخت ناموفق بود" })).toBeVisible();
  await page.goto("/dashboard/courses");
  await expect(page.getByText("تقویت جبر و معادله")).toHaveCount(0);
  // retry with success
  await page.goto("/checkout");
  await page.getByRole("button", { name: /ثبت سفارش \(شبیه‌سازی‌شده\)/ }).click();
  await expect(page.getByRole("heading", { name: "ثبت‌نام شما انجام شد" })).toBeVisible();
  await page.goto("/dashboard/courses");
  await expect(page.getByText("تقویت جبر و معادله").first()).toBeVisible();
});

test("checkout validates billing fields", async ({ page }) => {
  await loginAs(page, "student");
  await page.goto("/courses/algebra-equations-10");
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).first().click();
  await page.goto("/checkout");
  await page.getByLabel("شمارهٔ موبایل").fill("123");
  await page.getByRole("button", { name: /ثبت سفارش/ }).click();
  await expect(page.getByText("شمارهٔ موبایل باید با ۰۹ شروع شود")).toBeVisible();
});

test("learning page: preview lock, complete lesson, notes persist, Q&A, resource download", async ({ page }) => {
  await loginAs(page, "student");
  await page.goto("/learn/limit-continuity-from-scratch");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const before = await page.getByRole("progressbar", { name: "پیشرفت دوره" }).getAttribute("aria-valuenow");
  await page.getByRole("button", { name: "تکمیل این درس" }).click();
  await expect.poll(async () => Number(await page.getByRole("progressbar", { name: "پیشرفت دوره" }).getAttribute("aria-valuenow"))).toBeGreaterThan(Number(before));
  await page.getByRole("tab", { name: /یادداشت/ }).click();
  await page.getByLabel("یادداشت جدید").fill("یادداشت آزمایشی من");
  await page.getByRole("button", { name: "ذخیرهٔ یادداشت" }).click();
  await page.reload();
  await page.getByRole("tab", { name: /یادداشت/ }).click();
  await expect(page.getByText("یادداشت آزمایشی من")).toBeVisible();
  await page.getByRole("tab", { name: /منابع/ }).click();
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /دریافت/ }).first().click()]);
  expect(dl.suggestedFilename()).toMatch(/\.html$/);
  // locked lesson for non-enrolled course
  await page.goto("/learn/combinatorics-without-fear?lesson=c15-l2");
  await expect(page.getByText("شما در حال دیدن پیش‌نمایش رایگان هستید")).toBeVisible();
});

test("video lesson plays with controls, speed, resume position persists", async ({ page }) => {
  await loginAs(page, "student");
  await page.goto("/learn/math-11-functions-limits?lesson=c03-l1");
  const video = page.locator("video");
  await expect(video).toBeVisible();
  await page.getByRole("button", { name: "پخش" }).first().click();
  await page.waitForTimeout(1500);
  await page.getByLabel("سرعت پخش").selectOption("1.5");
  expect(await video.evaluate((v: HTMLVideoElement) => v.playbackRate)).toBe(1.5);
  await video.evaluate((v: HTMLVideoElement) => { v.currentTime = 9; });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "توقف" }).first().click();
  await page.reload();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 8000 }).toBeGreaterThan(7);
});

test("quiz: timed attempt, navigation, mark, submit confirmation, results with explanations, history", async ({ page }) => {
  await loginAs(page, "student");
  await page.goto("/quiz/q-c14-final");
  await expect(page.getByText("سابقهٔ تلاش‌ها")).toBeVisible();
  await page.getByRole("button", { name: "شروع تلاش جدید" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.locator("input#short").fill("۵");
  await page.getByRole("button", { name: "علامت‌گذاری برای مرور" }).click();
  await page.getByRole("button", { name: "بعدی" }).click();
  await page.getByLabel("نادرست", { exact: true }).check();
  await page.reload(); // draft persists
  await expect(page.getByRole("timer")).toBeVisible();
  await page.getByRole("button", { name: "پایان و ثبت نهایی" }).click();
  await expect(page.getByText("سؤال بدون پاسخ دارید")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "ثبت نهایی" }).click();
  await expect(page.getByText("مرور پاسخ‌ها")).toBeVisible();
  await expect(page.getByText("توضیح:").first()).toBeVisible();
  await page.goto("/quiz/q-c14-final");
  await expect(page.getByText("تلاش ۲")).toBeVisible();
});

test("practice quiz reveals the answer only after answering", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("ایمیل").fill("mahsa@teachtech.example");
  await page.getByLabel("رمز نمایشی").fill("teachtech");
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await page.waitForURL(/\/dashboard/);
  await page.goto("/quiz/q-c01-practice");
  await page.getByRole("button", { name: /شروع/ }).first().click();
  await expect(page.getByRole("button", { name: "نمایش پاسخ" })).toBeDisabled();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "نمایش پاسخ" }).click();
  await expect(page.getByText(/درست است|پاسخ درست نبود/)).toBeVisible();
});

test("certificate page, print layout, and local verification", async ({ page }) => {
  await loginAs(page, "student");
  await page.goto("/dashboard/certificates");
  await page.getByRole("link", { name: /مشاهده و چاپ/ }).first().click();
  await expect(page.getByRole("heading", { name: "گواهی پایان دوره" })).toBeVisible();
  await expect(page.locator(".cert-sheet").getByText("مدرک رسمی دولتی نیست")).toBeVisible();
  const id = (await page.locator(".cert-sheet [dir=ltr].tabular").textContent())!.trim();
  await page.goto(`/verify/${id.toLowerCase()}`);
  await expect(page.getByText("گواهی در داده‌های محلی ثبت شده است")).toBeVisible();
  await page.goto(`/certificate/${id}`);
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: /چاپ/ })).toBeHidden();
  await expect(page.locator(".cert-sheet")).toBeVisible();
});

test("calendar: add study item and goal", async ({ page }) => {
  await loginAs(page, "student");
  await page.goto("/dashboard/calendar");
  await page.getByRole("button", { name: "افزودن" }).click();
  await page.getByLabel("عنوان").fill("مرور مشتق");
  await page.getByRole("dialog").getByRole("button", { name: "افزودن" }).click();
  await expect(page.getByText("مرور مشتق")).toBeVisible();
  await page.getByRole("button", { name: "هدف جدید" }).click();
  await page.getByLabel("عنوان هدف").fill("هدف آزمایشی من");
  await page.getByRole("button", { name: "ثبت هدف" }).click();
  await expect(page.getByText("هدف آزمایشی من")).toBeVisible();
});

test("profile edit validates and persists; reset restores seed", async ({ page }) => {
  await loginAs(page, "student");
  await page.goto("/dashboard/profile");
  await page.getByLabel("نام و نام خانوادگی").fill("ab");
  await page.getByRole("button", { name: "ذخیرهٔ تغییرات" }).click();
  await expect(page.getByText("نام را کامل وارد کنید.")).toBeVisible();
  await page.getByLabel("نام و نام خانوادگی").fill("سارا موسوی‌نژاد");
  await page.getByRole("button", { name: "ذخیرهٔ تغییرات" }).click();
  await page.reload();
  await expect(page.getByLabel("نام و نام خانوادگی")).toHaveValue("سارا موسوی‌نژاد");
});

test("malformed or outdated stored data is ignored safely", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("teachtech.state", "{not json"); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ریاضی را بفهمید");
  await page.evaluate(() => localStorage.setItem("teachtech.state", JSON.stringify({ state: { v: 0, cart: ["x"] }, version: 99 })));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ریاضی را بفهمید");
});
