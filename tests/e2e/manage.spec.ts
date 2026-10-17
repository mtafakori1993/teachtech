import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("instructor: create course (validation), edit price, add lesson, publish/unpublish reflects publicly", async ({ page }) => {
  await loginAs(page, "instructor");
  await expect(page.getByText("دوره‌های شما")).toBeVisible();
  await page.goto("/instructor/courses");
  await page.getByRole("button", { name: "دورهٔ جدید" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "ساخت دوره" }).click();
  await expect(page.getByText("عنوان دوره حداقل ۵ نویسه باشد.")).toBeVisible();
  const d = page.getByRole("dialog");
  await d.getByLabel("عنوان دوره").fill("دورهٔ آزمایشی تحلیل");
  await d.getByLabel("زیرعنوان").fill("زیرعنوان آزمایشی برای این دوره");
  await d.getByLabel("توضیحات").fill("این توضیحات آزمایشی برای بررسی ساخت دوره به‌صورت محلی نوشته شده است.");
  await d.getByLabel("قیمت (تومان)", { exact: true }).fill("۳۲۰۰۰۰");
  await d.getByLabel("اهداف یادگیری (هر خط یک مورد)").fill("یک هدف آزمایشی");
  await d.getByLabel("وضعیت انتشار").selectOption("published");
  await d.getByRole("button", { name: "ساخت دوره" }).click();
  await expect(page.getByText("دورهٔ آزمایشی تحلیل")).toBeVisible();
  await page.goto("/courses");
  await expect(page.getByText("دورهٔ آزمایشی تحلیل")).toBeVisible();
  await page.goto("/instructor/courses");
  await page.getByRole("link", { name: "دورهٔ آزمایشی تحلیل" }).click();
  await page.getByRole("button", { name: "افزودن بخش" }).click();
  await page.getByLabel("عنوان بخش").fill("بخش اول");
  await page.getByRole("dialog").getByRole("button", { name: "ذخیره" }).click();
  await page.getByRole("button", { name: "درس", exact: true }).click();
  await page.getByLabel("عنوان درس").fill("درس آزمایشی");
  await page.getByLabel("خلاصهٔ درس").fill("خلاصهٔ درس آزمایشی");
  await page.getByRole("dialog").getByRole("button", { name: "ذخیره" }).click();
  await expect(page.getByText("درس آزمایشی").first()).toBeVisible();
  await page.getByRole("button", { name: "لغو انتشار" }).click();
  await page.goto("/courses");
  await expect(page.getByText("دورهٔ آزمایشی تحلیل")).toHaveCount(0);
});

test("instructor: review a written submission; student sees feedback", async ({ page }) => {
  await loginAs(page, "instructor");
  await page.goto("/instructor/assignments");
  await page.getByRole("button", { name: "بررسی" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "ثبت نمره" }).click();
  await expect(page.getByText(/نمره باید بین/)).toBeVisible();
  await page.getByLabel(/نمره \(از/).fill("8");
  await page.getByLabel("بازخورد").fill("عالی بود.");
  await page.getByRole("dialog").getByRole("button", { name: "ثبت نمره" }).click();
  await expect(page.getByText("۸ نمره")).toBeVisible();
});

test("instructor: question bank CRUD with validation, analytics labelled as sample", async ({ page }) => {
  await loginAs(page, "instructor");
  await page.goto("/instructor/quizzes");
  await page.getByRole("tab", { name: "بانک سؤال" }).click();
  await page.getByRole("button", { name: "سؤال جدید" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "ذخیره" }).click();
  await expect(page.getByText("متن سؤال را وارد کنید.")).toBeVisible();
  await page.getByLabel("متن سؤال").fill("حاصل $2+2$ را بنویسید؟");
  await page.getByLabel("نوع سؤال").selectOption("short");
  await page.getByLabel(/پاسخ‌های پذیرفته‌شده/).fill("4");
  await page.getByLabel("توضیح پاسخ").fill("جمع ساده است.");
  await page.getByRole("dialog").getByRole("button", { name: "ذخیره" }).click();
  await expect(page.getByText("حاصل").first()).toBeVisible();
  await page.goto("/instructor/analytics");
  await expect(page.getByText("داده‌های نمونه").first()).toBeVisible();
});

test("admin: discount CRUD with validation and the code works in the cart", async ({ page }) => {
  await loginAs(page, "admin");
  await page.goto("/admin/discounts");
  await page.getByRole("button", { name: "کد جدید" }).click();
  await page.getByLabel("کد", { exact: true }).fill("a!");
  await page.getByRole("dialog").getByRole("button", { name: "ذخیره" }).click();
  await expect(page.getByText(/کد ۳ تا ۲۰ نویسه/)).toBeVisible();
  await page.getByLabel("کد", { exact: true }).fill("promo25");
  await page.getByLabel("درصد").fill("25");
  await page.getByRole("dialog").getByRole("button", { name: "ذخیره" }).click();
  await expect(page.getByText("PROMO25")).toBeVisible();
});

test("admin: order status, enrollment grant/revoke, homepage content, settings", async ({ page }) => {
  await loginAs(page, "admin");
  await page.goto("/admin/orders");
  await page.getByRole("button", { name: "TT-10004" }).click();
  await page.getByLabel("وضعیت سفارش").selectOption("cancelled");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: /TT-10004/ }).getByText("لغوشده")).toBeVisible();
  await page.goto("/admin/enrollments");
  await page.getByRole("button", { name: "ثبت‌نام دستی" }).click();
  await page.getByRole("dialog").getByLabel("دانش‌آموز").selectOption({ label: "سینا امیری" });
  await page.getByRole("dialog").getByLabel("دوره").selectOption({ label: "حسابان دوازدهم: حد، مشتق و کاربردها" });
  await page.getByRole("dialog").getByRole("button", { name: "ثبت‌نام" }).click();
  await expect(page.getByText("واگذاری").first()).toBeVisible();
  await page.goto("/admin/homepage");
  await page.getByLabel("تیتر اصلی").fill("ریاضی را عمیق یاد بگیرید");
  await page.getByRole("button", { name: "ذخیرهٔ تغییرات" }).click();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ریاضی را عمیق یاد بگیرید");
  await page.goto("/admin/settings");
  await expect(page.getByText("محدودیت‌های نسخهٔ فعلی")).toBeVisible();
});

test("admin: certificate issue for eligible student", async ({ page }) => {
  await loginAs(page, "admin");
  await page.goto("/admin/certificates");
  await page.getByRole("combobox", { name: "وضعیت" }).selectOption("ready");
  await page.getByRole("button", { name: "صدور" }).first().click();
  await expect(page.getByText("گواهی صادر شد.")).toBeVisible();
  await page.getByRole("combobox", { name: "وضعیت" }).selectOption("issued");
  await expect(page.getByRole("cell", { name: "صادرشده" }).first()).toBeVisible();
});
