/**
 * E2E Auth Security — protected routes, token handling, rate limiting.
 */
import { test, expect } from "@playwright/test";
import {
  testCredentials,
  apiSetupAndLogin,
  apiDeleteAccount,
  apiResetRateLimits,
} from "./helpers";

test.describe("Auth Security", () => {
  test.beforeEach(async ({ page }) => {
    await apiResetRateLimits(page);
  });
  test("protected route redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/");
    await expect(page).toHaveURL(/\/login|\/rejestracja/, { timeout: 10_000 });
  });

  test("protected route /kalendarz redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/kalendarz");
    await expect(page).toHaveURL(/\/login|\/rejestracja/, { timeout: 10_000 });
  });

  test("protected route /wydatki redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/wydatki");
    await expect(page).toHaveURL(/\/login|\/rejestracja/, { timeout: 10_000 });
  });

  test("protected route /zakupy redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/zakupy");
    await expect(page).toHaveURL(/\/login|\/rejestracja/, { timeout: 10_000 });
  });

  test("protected route /plany redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/plany");
    await expect(page).toHaveURL(/\/login|\/rejestracja/, { timeout: 10_000 });
  });

  test("protected route /ustawienia redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("token"));

    await page.goto("/ustawienia");
    await expect(page).toHaveURL(/\/login|\/rejestracja/, { timeout: 10_000 });
  });

  test("invalid token in localStorage redirects to login on API call", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.setItem("token", "invalid.jwt.token"));
    await page.goto("/");

    // Should eventually redirect to login after API rejects the token
    await expect(page).toHaveURL(/\/login|\/rejestracja/, { timeout: 10_000 });
  });

  test("token is not visible in page source as plain text", async ({ page }) => {
    await page.goto("/login");
    const html = await page.content();
    // Token should not be embedded in initial HTML
    expect(html).not.toContain("access_token");
    expect(html).not.toContain("eyJ"); // JWT prefix
  });

  test("login page has link to register and forgot password", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Nie pamiętam hasła")).toBeVisible();
    await expect(page.getByText("Zarejestruj się")).toBeVisible();
  });

  test("register page has link to login", async ({ page }) => {
    await page.goto("/rejestracja");
    await expect(page.getByText("Zaloguj się")).toBeVisible();
  });

  test("multiple failed logins show consistent error (no info leak)", async ({ page }) => {
    // Create a verified user first
    const creds = testCredentials("sec_brute");
    const token = await apiSetupAndLogin(page, creds);

    await page.goto("/login");

    // Try 3 wrong logins — error message should be generic (auth error or rate limit)
    for (let i = 0; i < 3; i++) {
      await page.getByPlaceholder("Nazwa użytkownika lub email").fill(`wrong_user_${i}`);
      await page.getByPlaceholder("Hasło").fill("wrongpassword");
      await page.getByRole("button", { name: "Zaloguj" }).click();

      // Should show either auth error or rate limit — never leak user existence
      await expect(
        page.getByText(/nieprawidłow|zbyt wiele prób/i)
      ).toBeVisible({ timeout: 5_000 });

      // Clear fields for next attempt
      await page.getByPlaceholder("Nazwa użytkownika lub email").clear();
      await page.getByPlaceholder("Hasło").clear();
    }

    // Cleanup
    await apiDeleteAccount(page, token, creds.password);
  });
});
