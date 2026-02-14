import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("shows login page when unauthenticated", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ authenticated: false }),
      }),
    );

    await page.goto("/");

    await expect(page.getByText("Sign in to continue")).toBeVisible();
    await expect(page.getByText("Sign in with Google")).toBeVisible();
  });

  test("shows main app when authenticated", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ authenticated: true, email: "test@example.com" }),
      }),
    );

    await page.goto("/");

    await expect(page.getByText("test@example.com")).toBeVisible();
    await expect(page.getByRole("link", { name: "eemee" })).toBeVisible();
  });
});
