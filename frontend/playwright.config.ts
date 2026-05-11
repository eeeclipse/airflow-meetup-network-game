import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config.
 *
 * Three projects so the same spec set runs against desktop Chromium
 * plus the two mobile browser families our attendees are most
 * likely to use (AMB-021 mobile QA matrix). Run a single project
 * with `--project="Mobile Safari"` etc., or omit `--project` to
 * fan out across all three.
 */
export default defineConfig({
  testDir: "./e2e",
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      // iPhone 15 emulation — covers WebKit on iOS, the dominant
      // browser at Korean tech meetups per anecdote.
      use: { ...devices["iPhone 15"] },
    },
    {
      name: "Mobile Chrome",
      // Pixel 7 emulation — Blink on Android, the other dominant
      // browser family.
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command:
      "VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=test-anon-key VITE_GOOGLE_CLIENT_ID=test-google-client-id npx vite --host 127.0.0.1 --port 4173",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
