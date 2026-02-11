import { test, expect } from "@playwright/test";

const mockPhrase = {
  id: "test-phrase-id",
  phrase: "ephemeral",
  meaning: "lasting for a very short time",
  source: "GRE Book",
  tags: ["vocabulary", "gre"],
  memo: "Remember this word",
  created_at: "2025-01-15T10:00:00Z",
  updated_at: "2025-01-15T10:00:00Z",
};

function setupAuthRoute(page: import("@playwright/test").Page) {
  return page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authenticated: true, email: "test@example.com" }),
    }),
  );
}

test.describe("Phrases", () => {
  test("create a new phrase", async ({ page }) => {
    await setupAuthRoute(page);

    await page.route("**/api/phrases", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockPhrase),
        });
      }
      return route.continue();
    });

    await page.route(`**/api/phrases/${mockPhrase.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPhrase),
      }),
    );

    await page.goto("/new");
    await expect(page.getByText("New Phrase")).toBeVisible();

    // Fill form
    await page.locator('input[type="text"]').first().fill("ephemeral");
    await page.locator("textarea").first().fill("lasting for a very short time");

    // Submit
    await page.getByText("Create").click();

    // Should navigate to detail page
    await expect(page.getByText("ephemeral")).toBeVisible();
    await expect(page.getByText("lasting for a very short time")).toBeVisible();
  });

  test("view phrase detail", async ({ page }) => {
    await setupAuthRoute(page);

    await page.route(`**/api/phrases/${mockPhrase.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPhrase),
      }),
    );

    await page.goto(`/phrases/${mockPhrase.id}`);

    await expect(page.getByText("ephemeral")).toBeVisible();
    await expect(page.getByText("lasting for a very short time")).toBeVisible();
    await expect(page.getByText("GRE Book")).toBeVisible();
    await expect(page.getByText("vocabulary")).toBeVisible();
    await expect(page.getByText("Remember this word")).toBeVisible();
  });

  test("edit a phrase", async ({ page }) => {
    await setupAuthRoute(page);

    const updatedPhrase = { ...mockPhrase, phrase: "ubiquitous" };
    let putDone = false;

    await page.route(`**/api/phrases/${mockPhrase.id}`, (route) => {
      if (route.request().method() === "PUT") {
        putDone = true;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(updatedPhrase),
        });
      }
      // After PUT, return updated phrase for the detail page GET
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(putDone ? updatedPhrase : mockPhrase),
      });
    });

    await page.goto(`/phrases/${mockPhrase.id}/edit`);
    await expect(page.getByText("Edit Phrase")).toBeVisible();

    // Modify phrase
    const phraseInput = page.locator('input[type="text"]').first();
    await phraseInput.clear();
    await phraseInput.fill("ubiquitous");

    await page.getByText("Update").click();

    // Should navigate to detail page
    await expect(page.getByText("ubiquitous")).toBeVisible();
  });

  test("delete a phrase", async ({ page }) => {
    await setupAuthRoute(page);

    await page.route(`**/api/phrases/${mockPhrase.id}`, (route) => {
      if (route.request().method() === "DELETE") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPhrase),
      });
    });

    await page.goto(`/phrases/${mockPhrase.id}`);
    await expect(page.getByText("ephemeral")).toBeVisible();

    // Click delete and accept dialog
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByText("Delete").click();

    // Should navigate to home
    await expect(page).toHaveURL("/");
  });
});
