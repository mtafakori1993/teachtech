import { expect, type Page } from "@playwright/test";

export async function loginAs(page: Page, role: "student" | "instructor" | "admin", next = "") {
  await page.goto(`/login${next ? `?next=${next}` : ""}`);
  const name = { student: "دانش‌آموز: سارا موسوی", instructor: "مدرس: امیر کاویان", admin: "مدیر آموزشگاه: مدیریت آموزشگاه کاویان" }[role];
  await page.getByRole("button", { name: new RegExp(name.split(":")[0] + ":") }).click();
  await page.waitForURL(next ? new RegExp(next.replace("/", "\\/")) : { student: /\/dashboard/, instructor: /\/instructor/, admin: /\/admin/ }[role]);
}
export const noConsoleErrors = (page: Page) => {
  const errs: string[] = [];
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(e.message));
  return () => expect(errs, errs.join("\n")).toEqual([]);
};
