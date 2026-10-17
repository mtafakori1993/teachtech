import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3712);
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 1,
  workers: 2,
  reporter: [["list"]],
  use: { baseURL: process.env.BASE_URL ?? `http://localhost:${port}`, locale: "fa-IR", timezoneId: "Asia/Tehran", trace: "retain-on-failure", serviceWorkers: "allow" },
  webServer: process.env.BASE_URL ? undefined : { command: `npx next start -p ${port}`, port, reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } }, testMatch: /responsive/ },
  ],
});
