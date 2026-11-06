import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import os from "os";
import path from "path";

function resolveCachedChromiumExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const cacheRoot = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  const candidates = [
    path.join(
      cacheRoot,
      "chromium_headless_shell-1254",
      "chrome-headless-shell-mac-arm64",
      "chrome-headless-shell",
    ),
    path.join(
      cacheRoot,
      "chromium_headless_shell-1248",
      "chrome-headless-shell-mac-arm64",
      "chrome-headless-shell",
    ),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

const executablePath = resolveCachedChromiumExecutable();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start -- -p 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
