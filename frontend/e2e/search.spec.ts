import { test, expect } from "@playwright/test";

const mockResults = [
  {
    id: "id-1",
    phrase: "ephemeral",
    meaning: "lasting a short time",
    source: null,
    tags: ["vocab"],
    memo: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "id-2",
    phrase: "ubiquitous",
    meaning: "present everywhere",
    source: null,
    tags: [],
    memo: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

function setupAuthRoute(page: import("@playwright/test").Page) {
  return page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authenticated: true, email: "test@example.com" }),
    }),
  );
}

test.describe("Search", () => {
  test("semantic search from home page", async ({ page }) => {
    await setupAuthRoute(page);

    await page.route("**/api/search/semantic", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockResults),
      }),
    );

    await page.goto("/");

    const searchInput = page.getByPlaceholder("Search by meaning...");
    await searchInput.fill("short duration");
    await page.getByText("Search").click();

    // Should navigate to search results
    await expect(page).toHaveURL(/\/search\?q=short%20duration&mode=semantic/);
    await expect(page.getByText("ephemeral")).toBeVisible();
    await expect(page.getByText("ubiquitous")).toBeVisible();
  });

  test("text search", async ({ page }) => {
    await setupAuthRoute(page);

    await page.route("**/api/search/text**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockResults[0]]),
      }),
    );

    await page.goto("/");

    // Switch to text mode
    await page.getByText("Text").click();

    const searchInput = page.getByPlaceholder("Search by text...");
    await searchInput.fill("ephemeral");
    await page.getByText("Search").click();

    await expect(page).toHaveURL(/\/search\?q=ephemeral&mode=text/);
    await expect(page.getByText("ephemeral")).toBeVisible();
  });

  test("empty results shows message", async ({ page }) => {
    await setupAuthRoute(page);

    await page.route("**/api/search/semantic", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      }),
    );

    await page.goto("/");

    const searchInput = page.getByPlaceholder("Search by meaning...");
    await searchInput.fill("nonexistent");
    await page.getByText("Search").click();

    await expect(page.getByText("No results found.")).toBeVisible();
  });
});
