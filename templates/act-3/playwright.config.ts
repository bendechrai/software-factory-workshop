import { defineConfig, devices } from "@playwright/test";

// The port is fixed so Playwright knows which URL to wait for. Set E2E_PORT
// if 4390 is busy on your machine.
const port = Number(process.env.E2E_PORT ?? 4390);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node src/server.ts",
    url: baseURL,
    reuseExistingServer: false,
    env: { HOP_DB: ":memory:", PORT: String(port) },
    timeout: 30_000,
  },
});
