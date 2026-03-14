import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // auth tests must be sequential (single-user app)
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:81",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
