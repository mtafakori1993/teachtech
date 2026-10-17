// Captures real screenshots of the running production build. Usage: node scripts/capture.mjs [baseUrl]
import { chromium, devices } from "@playwright/test";
const base = process.argv[2] ?? "http://localhost:3712";
const b = await chromium.launch();
const desktop = { viewport: { width: 1440, height: 900 }, locale: "fa-IR", timezoneId: "Asia/Tehran" };
const mobile = { ...devices["Pixel 5"], viewport: { width: 390, height: 844 }, locale: "fa-IR", timezoneId: "Asia/Tehran" };

async function session(opts, role) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage();
  if (role) {
    await p.goto(base + "/login");
    await p.getByRole("button", { name: new RegExp({ student: "دانش‌آموز: سارا", instructor: "مدرس: امیر", admin: "مدیر آموزشگاه: مدیریت" }[role]) }).click();
    await p.waitForURL(new RegExp({ student: "dashboard", instructor: "instructor", admin: "admin" }[role]));
  }
  return { ctx, p };
}
const shot = async (p, url, name, full = false, pre) => { await p.goto(base + url); await p.waitForLoadState("networkidle"); if (pre) await pre(p); await p.waitForTimeout(700); await p.screenshot({ path: `screenshots/${name}.png`, fullPage: full }); console.log("ok", name); };

let { ctx, p } = await session(desktop);
await shot(p, "/", "01-home-desktop", true);
await shot(p, "/courses", "02-catalog-desktop");
await shot(p, "/courses/calculus-12-limit-derivative", "03-course-detail-desktop", true);
await shot(p, "/instructors/amir-kavian", "04-instructor-profile-desktop");
await ctx.close();

({ ctx, p } = await session(desktop, "student"));
await shot(p, "/dashboard", "05-student-dashboard-desktop", true);
await shot(p, "/learn/math-11-functions-limits?lesson=c03-l1", "06-video-learning-desktop", false, async (p) => { await p.getByRole("button", { name: "پخش" }).first().click(); await p.waitForTimeout(6500); await p.getByRole("button", { name: "توقف" }).first().click(); });
await shot(p, "/learn/math-11-functions-limits?lesson=c03-l5", "07-lesson-board-desktop");
await shot(p, "/quiz/q-c14-final", "08-quiz-intro-desktop");
await shot(p, "/dashboard/quizzes", "09-student-quizzes-desktop", true);
await p.goto(base + "/quiz/q-c10-final"); const href = await p.locator('a:has-text("مرور")').first().getAttribute("href"); await shot(p, href, "10-quiz-results-desktop", true);
await shot(p, "/dashboard/certificates", "11-student-certificates-desktop");
const cert = await (async () => { await p.goto(base + "/dashboard/certificates"); return p.getByRole("link", { name: /مشاهده و چاپ/ }).first().getAttribute("href"); })();
await shot(p, cert, "12-certificate-desktop", true);
await shot(p, "/dashboard/calendar", "13-learning-calendar-desktop", true);
await ctx.close();

({ ctx, p } = await session(desktop, "instructor"));
await shot(p, "/instructor", "14-instructor-dashboard-desktop", true);
await shot(p, "/instructor/courses/c07", "15-instructor-course-editor-desktop", true);
await shot(p, "/instructor/analytics", "16-instructor-analytics-desktop", true);
await ctx.close();

({ ctx, p } = await session(desktop, "admin"));
await shot(p, "/admin", "17-admin-dashboard-desktop", true);
await shot(p, "/admin/orders", "18-admin-orders-desktop");
await shot(p, "/admin/discounts", "19-admin-discounts-desktop");
await ctx.close();

({ ctx, p } = await session(mobile));
await shot(p, "/", "20-home-mobile", true);
await shot(p, "/courses", "21-catalog-mobile");
await ctx.close();
({ ctx, p } = await session(mobile, "student"));
await shot(p, "/dashboard", "22-student-dashboard-mobile", true);
await shot(p, "/learn/math-11-functions-limits?lesson=c03-l1", "23-video-learning-mobile");
await ctx.close();

// PWA install experience: synthetic beforeinstallprompt (Chromium installability UI itself is outside page screenshots)
ctx = await b.newContext(mobile); p = await ctx.newPage();
await p.addInitScript(() => setTimeout(() => { const e = new Event("beforeinstallprompt", { cancelable: true }); e.prompt = async () => {}; e.userChoice = new Promise(() => {}); window.dispatchEvent(e); }, 200));
await p.goto(base + "/"); await p.getByRole("complementary", { name: "نصب اپلیکیشن" }).waitFor({ timeout: 30000 }); await p.waitForTimeout(600);
await p.screenshot({ path: "screenshots/24-pwa-install-banner-mobile.png" }); console.log("ok 24");
await ctx.close();
ctx = await b.newContext({ ...mobile, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" }); p = await ctx.newPage();
await p.goto(base + "/"); await p.getByRole("complementary", { name: "نصب اپلیکیشن" }).waitFor({ timeout: 30000 }); await p.getByRole("button", { name: "راهنمای نصب" }).click(); await p.waitForTimeout(600);
await p.screenshot({ path: "screenshots/25-pwa-ios-instructions-mobile.png" }); console.log("ok 25");
await ctx.close(); await b.close();
