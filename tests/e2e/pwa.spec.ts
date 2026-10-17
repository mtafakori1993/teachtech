import { expect, test } from "@playwright/test";

test("manifest is valid and every icon loads", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m).toMatchObject({ name: expect.stringContaining("TeachTech"), short_name: "تیچ‌تک", display: "standalone", scope: "/", lang: "fa", dir: "rtl", theme_color: "#2F80ED", background_color: "#FFFDF5" });
  expect(m.start_url).toMatch(/^\//);
  const sizes = m.icons.map((i: { sizes: string; purpose?: string }) => `${i.sizes}:${i.purpose}`);
  expect(sizes).toEqual(expect.arrayContaining(["192x192:any", "512x512:any", "512x512:maskable"]));
  for (const i of m.icons) {
    const r = await request.get(i.src);
    expect(r.status(), i.src).toBe(200);
    expect(r.headers()["content-type"]).toContain("image/png");
  }
  for (const s of m.shortcuts ?? []) expect((await request.get(s.url)).status()).toBe(200);
});

test("service worker registers in production, controls the page, is served from root scope with no-cache", async ({ page, request, baseURL }) => {
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["cache-control"]).toContain("no-cache");
  expect(sw.headers()["service-worker-allowed"]).toBe("/");
  await page.goto("/");
  const scope = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return r.scope; });
  expect(scope).toBe(`${baseURL}/`);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
});

test("offline: previously visited public page still opens; unknown/private routes get the offline fallback", async ({ page, context }) => {
  await page.goto("/courses");
  await page.goto("/about");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // ensure controlled
  await page.waitForTimeout(800);
  await context.setOffline(true);
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "آموزشگاه کاویان و TeachTech" })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByText("اتصال به اینترنت برقرار نیست")).toBeVisible();
  await page.goto("/never-visited-page");
  await expect(page.getByText("اتصال به اینترنت برقرار نیست")).toBeVisible();
  await context.setOffline(false);
});

test("private areas and API are never stored by the service worker", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /دانش‌آموز: سارا/ }).click();
  await page.waitForURL(/dashboard/);
  await page.goto("/dashboard/orders");
  await page.waitForTimeout(500);
  const cached = await page.evaluate(async () => {
    const out: string[] = [];
    for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) out.push(new URL(r.url).pathname);
    return out;
  });
  expect(cached.some((p) => /^\/(dashboard|admin|instructor|learn|quiz|order|certificate|checkout|cart|login|api)/.test(p))).toBe(false);
});

test("install banner: appears only after beforeinstallprompt, native prompt fires only on click, dismissal is remembered", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __prompted: number }).__prompted = 0;
    setTimeout(() => {
      const ev = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
      ev.prompt = async () => { (window as unknown as { __prompted: number }).__prompted++; };
      ev.userChoice = Promise.resolve({ outcome: "dismissed" });
      window.dispatchEvent(ev);
    }, 300);
  });
  await page.goto("/");
  const banner = page.getByRole("complementary", { name: "نصب اپلیکیشن" });
  await expect(banner).toBeVisible({ timeout: 30000 });
  expect(await page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(0); // never auto-prompts
  await banner.getByRole("button", { name: "نصب اپلیکیشن" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1);
  await expect(banner).toBeHidden();
  await page.reload();
  await page.waitForTimeout(11000);
  await expect(page.getByRole("complementary", { name: "نصب اپلیکیشن" })).toBeHidden(); // dismissed → not shown again
});

test("install banner is not shown in standalone display mode", async ({ page }) => {
  await page.addInitScript(() => {
    const orig = window.matchMedia.bind(window);
    window.matchMedia = (q: string) => (q.includes("display-mode: standalone") ? ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false } as unknown as MediaQueryList) : orig(q));
    setTimeout(() => window.dispatchEvent(new Event("beforeinstallprompt", { cancelable: true })), 300);
  });
  await page.goto("/");
  await page.waitForTimeout(11000);
  await expect(page.getByRole("complementary", { name: "نصب اپلیکیشن" })).toBeHidden();
});

test.describe("iOS manual guidance", () => {
  test.use({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", viewport: { width: 390, height: 844 }, hasTouch: true });
  test("shows Add to Home Screen instructions, not a native-prompt button", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("complementary", { name: "نصب اپلیکیشن" });
    await expect(banner).toBeVisible({ timeout: 30000 });
    await banner.getByRole("button", { name: "راهنمای نصب" }).click();
    await expect(page.getByRole("dialog").getByText("Add to Home Screen").first()).toBeVisible();
  });
});

test("manual install entry exists on /install and in the footer", async ({ page }) => {
  await page.goto("/install");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("نصب TeachTech");
  await expect(page.getByText("Install app").first()).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "نصب اپلیکیشن" }).last().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("robots and sitemap list only public routes", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/dashboard/);
  expect(robots).toContain("teachtech.shomaaa.ir/sitemap.xml");
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/courses/calculus-12-limit-derivative");
  expect(sm).not.toMatch(/teachtech\.shomaaa\.ir\/(dashboard|admin|instructor|learn|quiz|order|certificate|cart|checkout|login)(\/|<)/);
  expect(sm).not.toContain("advanced-derivative-techniques"); // draft course
});
