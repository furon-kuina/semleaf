import { test, expect } from "@playwright/test";

const mockPhrase = {
  id: "nav-test-id",
  phrase: "test phrase",
  meaning: "test meaning",
  source: null,
  tags: [],
  memo: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

function setupRoutes(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ authenticated: true, email: "test@example.com" }),
      }),
    ),
    page.route(`**/api/phrases/${mockPhrase.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPhrase),
      }),
    ),
  ]);
}

test.describe("Navigation", () => {
  test("header navigation links work", async ({ page }) => {
    await setupRoutes(page);

    await page.goto(`/phrases/${mockPhrase.id}`);
    await expect(page.getByText("test phrase")).toBeVisible();

    // Logo links to home
    await page.getByText("eemee").first().click();
    await expect(page).toHaveURL("/");

    // "+ New" links to form
    await page.getByRole("link", { name: "+ New", exact: true }).click();
    await expect(page).toHaveURL("/new");
    await expect(page.getByText("New Phrase")).toBeVisible();
  });

  test("back/cancel links work", async ({ page }) => {
    await setupRoutes(page);

    // Detail page → Back to home
    await page.goto(`/phrases/${mockPhrase.id}`);
    await expect(page.getByText("test phrase")).toBeVisible();
    await page.getByText("Back").click();
    await expect(page).toHaveURL("/");

    // Form page → Cancel
    await page.goto("/new");
    await expect(page.getByText("New Phrase")).toBeVisible();
    await page.getByText("Cancel").click();
    await expect(page).toHaveURL("/");
  });
});
