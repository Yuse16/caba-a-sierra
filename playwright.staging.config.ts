import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.STAGING_PREVIEW_URL?.trim().replace(/\/$/, "")

if (!baseURL || !baseURL.startsWith("https://")) {
  throw new Error("STAGING_PREVIEW_URL debe contener la URL HTTPS del Preview de staging.")
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "staging-experience.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "staging-desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
})
