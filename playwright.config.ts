import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["auth-experience.spec.ts", "staging-experience.spec.ts"],
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "android-320", use: { ...devices["Pixel 5"], viewport: { width: 320, height: 720 } } },
    { name: "android-360", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 800 } } },
    { name: "android-375", use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } } },
    { name: "android-390", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { name: "android-412", use: { ...devices["Pixel 7"], viewport: { width: 412, height: 915 } } },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
  ],
  webServer: {
    command: "pnpm dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
