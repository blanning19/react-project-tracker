import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for end-to-end smoke tests.
 *
 * Tests live in frontend/e2e/ and run against the Vite dev server.
 *
 * Prerequisites before running:
 *   1. Backend must be running:  python manage.py runserver
 *   2. A test user must exist:   python manage.py createsuperuser
 *      (or set E2E_USERNAME / E2E_PASSWORD env vars to match an existing user)
 *   3. Install browsers once:    npx playwright install --with-deps chromium
 *
 * Run:
 *   npm run test:e2e          — headless, single run
 *   npm run test:e2e:ui       — Playwright UI mode (visual, great for debugging)
 *   npm run test:e2e:headed   — headed browser (watch it run)
 */
export default defineConfig({
    testDir: "./e2e",

    // Stop after first failure in CI to keep feedback fast.
    // Remove or set to 0 locally if you want to see all failures at once.
    maxFailures: process.env.CI ? 1 : 0,

    // Each test gets 30 seconds. The backend + Vite are local so this is generous.
    timeout: 30_000,

    // Retry once on CI to absorb flaky timing — no retries locally.
    retries: process.env.CI ? 1 : 0,

    // Run tests sequentially. The smoke suite is small and order matters
    // (login must succeed before the project tests run).
    workers: 1,

    reporter: [
        ["list"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
    ],

    use: {
        // Vite dev server
        baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",

        // Keep a trace on first retry so failures are debuggable in CI.
        trace: "on-first-retry",

        // Screenshot on failure
        screenshot: "only-on-failure",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],

    // Start the Vite dev server automatically before the tests run.
    // If you prefer to start it manually, comment this block out.
    webServer: {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: true, // don't restart if already running
        timeout: 30_000,
    },
});
