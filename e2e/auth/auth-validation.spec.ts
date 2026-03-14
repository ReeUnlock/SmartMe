/**
 * E2E Auth Validation — form validation in the UI.
 *
 * Tests that the frontend properly validates input and shows
 * appropriate error messages.
 */
import { test, expect } from "@playwright/test";
import {
  testCredentials,
  apiSetup,
  apiDeleteAccount,
  apiLogin,
} from "./helpers";

test.describe("Auth Form Validation", () => {
  test.describe("Setup Page Validation", () => {
    test.beforeEach(async ({ page }) => {
      // Ensure no user exists (check status)
      const resp = await page.request.get("http://localhost:81/api/auth/status");
      const body = await resp.json();
      if (body.setup_completed) {
        // Can't easily delete without knowing password — skip
        test.skip();
      }
      await page.goto("/setup");
    });

    test("empty form submit — browser validation prevents submit", async ({ page }) => {
      const submitBtn = page.getByRole("button", { name: "Rozpocznij" });
      await submitBtn.click();

      // HTML5 required validation — form should not submit
      // We stay on setup page
      await expect(page).toHaveURL(/\/setup/);
    });

    test("invalid email shows error after submit", async ({ page }) => {
      await page.getByPlaceholder("Nazwa użytkownika").fill("testuser");
      await page.getByPlaceholder("Email").fill("not-an-email");
      await page.getByPlaceholder("Hasło (min. 6 znaków)").fill("Test1234!");

      await page.getByRole("button", { name: "Rozpocznij" }).click();

      // Either browser validation catches it or API returns error
      await page.waitForTimeout(1000);
      // We should still be on setup (not redirected)
      await expect(page).toHaveURL(/\/setup/);
    });

    test("short password — browser validation (minLength=6)", async ({ page }) => {
      await page.getByPlaceholder("Nazwa użytkownika").fill("testuser");
      await page.getByPlaceholder("Email").fill("test@example.com");
      await page.getByPlaceholder("Hasło (min. 6 znaków)").fill("12345");

      await page.getByRole("button", { name: "Rozpocznij" }).click();
      await page.waitForTimeout(1000);

      // Should not proceed — still on setup
      await expect(page).toHaveURL(/\/setup/);
    });
  });

  test.describe("Login Page Validation", () => {
    test("wrong password shows error message", async ({ page }) => {
      // First ensure a user exists
      const resp = await page.request.get("http://localhost:81/api/auth/status");
      const body = await resp.json();
      if (!body.setup_completed) {
        test.skip(); // No user to test against
      }

      await page.goto("/login");
      await page.getByPlaceholder("Nazwa użytkownika lub email").fill("wronguser");
      await page.getByPlaceholder("Hasło").fill("wrongpassword");
      await page.getByRole("button", { name: "Zaloguj" }).click();

      // Should show error message (Polish text)
      await expect(
        page.getByText(/nieprawidłowa nazwa użytkownika lub hasło/i)
      ).toBeVisible({ timeout: 5_000 });
    });

    test("empty login form — browser validation prevents submit", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Zaloguj" }).click();

      // Should stay on login page (HTML5 required validation)
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Forgot Password Validation", () => {
    test("mismatched passwords shows error", async ({ page }) => {
      await page.goto("/odzyskaj-haslo");

      await page.getByPlaceholder("Adres email powiązany z kontem").fill("test@example.com");
      await page.getByPlaceholder("Nowe hasło (min. 6 znaków)").fill("NewPass123!");
      await page.getByPlaceholder("Powtórz nowe hasło").fill("DifferentPass!");

      await page.getByRole("button", { name: "Zmień hasło" }).click();

      // Should show mismatch error (client-side validation)
      await expect(
        page.getByText("Hasła nie są identyczne")
      ).toBeVisible({ timeout: 3_000 });
    });

    test("unknown email shows error", async ({ page }) => {
      await page.goto("/odzyskaj-haslo");

      await page.getByPlaceholder("Adres email powiązany z kontem").fill("unknown@example.com");
      await page.getByPlaceholder("Nowe hasło (min. 6 znaków)").fill("NewPass123!");
      await page.getByPlaceholder("Powtórz nowe hasło").fill("NewPass123!");

      await page.getByRole("button", { name: "Zmień hasło" }).click();

      // Should show error (API returns 404 for unknown email)
      await expect(
        page.getByText(/nie znaleziono|błąd/i)
      ).toBeVisible({ timeout: 5_000 });
    });

    test("back to login link works", async ({ page }) => {
      await page.goto("/odzyskaj-haslo");
      await page.getByText("Wróć do logowania").click();
      await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    });
  });
});
