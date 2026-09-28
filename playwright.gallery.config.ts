import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.GALLERY_E2E_BASE_URL?.trim().replace(/\/$/, "")
const target = process.env.GALLERY_E2E_TARGET

if (!baseURL || !["local", "staging"].includes(target ?? "")) {
  throw new Error("La suite de galería debe iniciarse con scripts/run-gallery-e2e.mjs.")
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "gallery-experience.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  timeout: 360_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  globalSetup: "./tests/e2e/gallery.global-setup.ts",
  globalTeardown: "./tests/e2e/gallery.global-teardown.ts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "gallery-regression-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: target === "local" ? {
    command: "pnpm build && pnpm start --hostname 127.0.0.1 --port 3100",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 600_000,
  } : undefined,
})
