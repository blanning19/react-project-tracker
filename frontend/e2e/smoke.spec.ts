import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke test suite for the Project Tracker app.
 *
 * Covers the critical happy path:
 *   1. Login page loads and rejects bad credentials
 *   2. Valid login redirects to the project list
 *   3. Project list loads and shows data
 *   4. A project can be created via the form
 *   5. The created project appears in the list
 *   6. The created project can be deleted
 *   7. Logout clears the session and redirects to login
 *
 * Credentials come from environment variables — set E2E_USERNAME and
 * E2E_PASSWORD before running, or create a user matching the defaults.
 *
 * Default credentials:
 *   E2E_USERNAME=User1
 *   E2E_PASSWORD=password1
 */

const USERNAME = process.env.E2E_USERNAME ?? "User1";
const PASSWORD = process.env.E2E_PASSWORD ?? "password1";
const TEST_PROJECT_NAME = `E2E Smoke Test ${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(page: Page) {
    await page.goto("/login");
    await page.getByLabel("Username").fill(USERNAME);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/", { timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Authentication", () => {
    test("login page renders", async ({ page }) => {
        await page.goto("/login");
        await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
        await expect(page.getByLabel("Username")).toBeVisible();
        await expect(page.getByLabel("Password")).toBeVisible();
        await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("wrong credentials shows error", async ({ page }) => {
        await page.goto("/login");
        await page.getByLabel("Username").fill("nobody");
        await page.getByLabel("Password").fill("wrongpassword");
        await page.getByRole("button", { name: /sign in/i }).click();

        await expect(page).toHaveURL(/login/);
        await expect(page.getByRole("alert")).toBeVisible();
    });

    test("valid login redirects to home", async ({ page }) => {
        await login(page);
        await expect(page).toHaveURL("/");
    });
});

test.describe("Project list", () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test("project list loads", async ({ page }) => {
        await expect(
            page.getByText("Projects").first()
        ).toBeVisible({ timeout: 10_000 });
    });

    test("pagination controls are visible when there are projects", async ({ page }) => {
        const hasProjects = await page.getByRole("row").count() > 1;
        if (hasProjects) {
            await expect(page.locator(".card-footer")).toBeVisible();
        }
    });

    test("search filter narrows results", async ({ page }) => {
        const searchInput = page.getByPlaceholder(/search/i);
        await expect(searchInput).toBeVisible();

        await searchInput.fill("zzznomatch");
        await expect(
            page.getByText(/no projects/i).or(page.getByText(/no results/i)).first()
        ).toBeVisible({ timeout: 5_000 });

        await searchInput.clear();
    });
});

test.describe("Project CRUD", () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test("can create a project", async ({ page }) => {
        // Navigate to create page via the sidebar NavLink
        await page.getByRole("link", { name: /^create$/i }).click();
        await expect(page).toHaveURL(/create/);

        // Project name
        await page.getByPlaceholder(/e\.g\. Q3 Infrastructure/i).fill(TEST_PROJECT_NAME);

        // Status — options are static (STATUS_OPTIONS constant), no async wait needed.
        const statusSelect = page.locator("label").filter({ hasText: /^Status$/ })
            .locator("xpath=..").locator("select");
        await statusSelect.selectOption("Active");

        // Project manager — options are loaded async via React Query; wait for
        // at least one real option to appear, then select the first.
        const managerSelect = page.locator("label").filter({ hasText: /^Project manager$/ })
            .locator("xpath=..").locator("select");
        await expect(managerSelect.locator("option:not([value=''])").first()).toBeAttached({ timeout: 10_000 });
        await managerSelect.selectOption({ index: 1 });

        // Employees — schema requires min 1. Check the first employee checkbox.
        const firstEmployee = page.locator("label[class*='checkItem']").first();
        await expect(firstEmployee).toBeVisible({ timeout: 10_000 });
        await firstEmployee.click();

        // Dates
        await page.locator("label").filter({ hasText: /^Start date$/ })
            .locator("xpath=..").locator("input[type='date']").fill("2025-01-01");
        await page.locator("label").filter({ hasText: /^End date$/ })
            .locator("xpath=..").locator("input[type='date']").fill("2025-12-31");

        // Submit
        await page.getByRole("button", { name: /save|create|submit/i }).click();

        // Successful save redirects to home
        await expect(page).toHaveURL("/", { timeout: 10_000 });
    });

    test("created project appears in the list", async ({ page }) => {
        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill(TEST_PROJECT_NAME);

        await expect(
            page.getByText(TEST_PROJECT_NAME).first()
        ).toBeVisible({ timeout: 10_000 });
    });

    test("can delete the created project", async ({ page }) => {
        // Search to find it
        await page.getByPlaceholder(/search/i).fill(TEST_PROJECT_NAME);
        await expect(page.getByText(TEST_PROJECT_NAME).first()).toBeVisible({ timeout: 10_000 });

        // Click the delete button for this row
        await page.getByRole("button", { name: new RegExp(`delete ${TEST_PROJECT_NAME}`, "i") }).click();

        // Confirm in the modal
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.getByRole("button", { name: /^delete$/i }).click();

        // Modal should close and project should be gone
        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });
        await expect(page.getByText(TEST_PROJECT_NAME).first()).not.toBeVisible({ timeout: 5_000 });
    });
});

test.describe("Logout", () => {
    test("logout redirects to login and blocks access", async ({ page }) => {
        await login(page);

        // Click the Logout button in the sidebar
        await page.getByRole("button", { name: /^logout$/i }).click();

        // Should redirect to login
        await expect(page).toHaveURL(/login/, { timeout: 10_000 });

        // Trying to access home directly should redirect back to login
        await page.goto("/");
        await expect(page).toHaveURL(/login/);
    });
});