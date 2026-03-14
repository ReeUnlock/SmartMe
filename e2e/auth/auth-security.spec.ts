/**
 * E2E Auth Security — protected routes, token handling, rate limiting.
 */
import { test, expect } from "@playwright/test";
import { testCredentials, apiSetup, apiDeleteAccount } from "./helpers";

test.describe("Auth Security", () => {
  test("protected route redirects to login when not authenticated", async ({ page }) => {
    // Clear any stored token
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    // Try to access dashboard directly
    await page.goto("/");
    await expect(page).toHaveURL(/\/login|\/setup/, { timeout: 10_000 });
  });

  test("protected route /kalendarz redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/kalendarz");
    await expect(page).toHaveURL(/\/login|\/setup/, { timeout: 10_000 });
  });

  test("protected route /wydatki redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/wydatki");
    await expect(page).toHaveURL(/\/login|\/setup/, { timeout: 10_000 });
  });

  test("protected route /zakupy redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/zakupy");
    await expect(page).toHaveURL(/\/login|\/setup/, { timeout: 10_000 });
  });

  test("protected route /plany redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/plany");
    await expect(page).toHaveURL(/\/login|\/setup/, { timeout: 10_000 });
  });

  test("protected route /ustawienia redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/ustawienia");
    await expect(page).toHaveURL(/\/login|\/setup/, { timeout: 10_000 });
  });

  test("invalid token in localStorage redirects to login on API call", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.setItem("token", "invalid.jwt.token"));
    await page.goto("/");

    // Should eventually redirect to login after API rejects the token
    await expect(page).toHaveURL(/\/login|\/setup/, { timeout: 10_000 });
  });

  test("token is not visible in page source as plain text", async ({ page }) => {
    const resp = await page.request.get("http://localhost:81/api/auth/status");
    const body = await resp.json();
    if (!body.setup_completed) {
      test.skip(); // No user to test against
    }

    await page.goto("/login");
    const html = await page.content();
    // Token should not be embedded in initial HTML
    expect(html).not.toContain("access_token");
    expect(html).not.toContain("eyJ"); // JWT prefix
  });

  test("login page has link to register and forgot password", async ({ page }) => {
    await page.goto("/login");

    // Check navigation links exist
    await expect(page.getByText("Nie pamiętam hasła")).toBeVisible();
    await expect(page.getByText("Zarejestruj się")).toBeVisible();
  });

  test("setup page has link to login", async ({ page }) => {
    await page.goto("/setup");
    await expect(page.getByText("Zaloguj się")).toBeVisible();
  });

  test("multiple failed logins show consistent error (no info leak)", async ({ page }) => {
    const resp = await page.request.get("http://localhost:81/api/auth/status");
    const body = await resp.json();
    if (!body.setup_completed) {
      test.skip();
    }

    await page.goto("/login");

    // Try 3 wrong logins — error message should be generic
    for (let i = 0; i < 3; i++) {
      await page.getByPlaceholder("Nazwa użytkownika lub email").fill(`wrong_user_${i}`);
      await page.getByPlaceholder("Hasło").fill("wrongpassword");
      await page.getByRole("button", { name: "Zaloguj" }).click();

      await expect(
        page.getByText(/nieprawidłowa nazwa użytkownika lub hasło/i)
      ).toBeVisible({ timeout: 5_000 });

      // Clear fields for next attempt
      await page.getByPlaceholder("Nazwa użytkownika lub email").clear();
      await page.getByPlaceholder("Hasło").clear();
    }
  });
});
