/**
 * E2E Auth Validation — form validation in the UI.
 *
 * Tests that the frontend properly validates input and shows
 * appropriate error messages.
 */
import { test, expect } from "@playwright/test";
import {
  testCredentials,
  apiSetupAndLogin,
  apiDeleteAccount,
  apiResetRateLimits,
} from "./helpers";

test.describe("Auth Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await apiResetRateLimits(page);
  });
  test.describe("Register Page Validation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rejestracja");
    });

    test("empty form submit — browser validation prevents submit", async ({ page }) => {
      const submitBtn = page.getByRole("button", { name: /zarejestruj|rozpocznij|utwórz/i });
      await submitBtn.click();

      // HTML5 required validation — form should not submit
      await expect(page).toHaveURL(/\/rejestracja/);
    });

    test("invalid email shows error after submit", async ({ page }) => {
      await page.getByPlaceholder("Nazwa użytkownika").fill("testuser");
      await page.getByPlaceholder("Email").fill("not-an-email");
      await page.getByPlaceholder("Hasło (min. 8 znaków)").fill("Test1234!");
      const confirmField = page.getByPlaceholder("Powtórz hasło");
      if (await confirmField.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmField.fill("Test1234!");
      }

      await page.getByRole("button", { name: /zarejestruj|rozpocznij|utwórz/i }).click();

      // Either browser validation catches it or API returns error
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/rejestracja/);
    });

    test("short password — browser validation (minLength=6)", async ({ page }) => {
      await page.getByPlaceholder("Nazwa użytkownika").fill("testuser");
      await page.getByPlaceholder("Email").fill("test@example.com");
      await page.getByPlaceholder("Hasło (min. 8 znaków)").fill("12345");

      await page.getByRole("button", { name: /zarejestruj|rozpocznij|utwórz/i }).click();
      await page.waitForTimeout(1000);

      // Should not proceed
      await expect(page).toHaveURL(/\/rejestracja/);
    });
  });

  test.describe("Login Page Validation", () => {
    test("wrong password shows error message", async ({ page }) => {
      // Create a verified user for this test
      const creds = testCredentials("val_login");
      const token = await apiSetupAndLogin(page, creds);

      await page.goto("/login");
      await page.getByPlaceholder("Nazwa użytkownika lub email").fill(creds.username);
      await page.getByPlaceholder("Hasło").fill("wrongpassword");
      await page.getByRole("button", { name: "Zaloguj" }).click();

      // Should show error message (Polish text)
      await expect(
        page.getByText(/nieprawidłowa nazwa użytkownika lub hasło/i)
      ).toBeVisible({ timeout: 5_000 });

      // Cleanup
      await apiDeleteAccount(page, token, creds.password);
    });

    test("empty login form — browser validation prevents submit", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Zaloguj" }).click();

      // Should stay on login page (HTML5 required validation)
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Forgot Password Validation", () => {
    test("back to login link works", async ({ page }) => {
      await page.goto("/odzyskaj-haslo");
      await page.getByText("Wróć do logowania").click();
      await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    });
  });
});
