/**
 * E2E Auth Lifecycle — full user flow through the UI.
 *
 * Prerequisites: App running at http://localhost:81 (docker-compose up)
 *
 * Flow: Register → Verify Email → Login → Dashboard → Change Password →
 *       Forgot Password → Delete Account → Verify account gone
 */
import { test, expect } from "@playwright/test";
import {
  testCredentials,
  apiRegister,
  apiVerifyEmail,
  apiLogin,
  apiDeleteAccount,
  apiSetupAndLogin,
  apiResetRateLimits,
} from "./helpers";

const creds = testCredentials("lifecycle");
let currentPassword = creds.password;

test.describe.serial("Auth Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await apiResetRateLimits(page);
  });

  test("1. Register via /rejestracja", async ({ page }) => {
    await page.goto("/rejestracja");

    await page.getByPlaceholder("Nazwa użytkownika").fill(creds.username);
    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Hasło (min. 8 znaków)").fill(creds.password);
    // confirmPassword field if present
    const confirmField = page.getByPlaceholder("Powtórz hasło");
    if (await confirmField.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmField.fill(creds.password);
    }

    await page.getByRole("button", { name: /zarejestruj|rozpocznij|utwórz/i }).click();

    // Should show success message about checking email
    await expect(
      page.getByText(/sprawdź.*email|konto utworzone/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("2. Login before verification fails with 403", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("Nazwa użytkownika lub email").fill(creds.username);
    await page.getByPlaceholder("Hasło").fill(creds.password);
    await page.getByRole("button", { name: "Zaloguj" }).click();

    // Should show email verification error (may match multiple elements)
    await expect(
      page.getByText(/potwierdź.*email|weryfikac/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("3. Verify email (via test API) and login", async ({ page }) => {
    // Verify email using dev-only endpoint
    await apiVerifyEmail(page, creds.email);

    // Now login should work
    await page.goto("/login");
    await page.getByPlaceholder("Nazwa użytkownika lub email").fill(creds.username);
    await page.getByPlaceholder("Hasło").fill(creds.password);
    await page.getByRole("button", { name: "Zaloguj" }).click();

    // Should redirect away from login (to dashboard or onboarding)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("4. Verify logged in — /me returns user data", async ({ page }) => {
    const token = await apiLogin(page, creds.username, currentPassword);
    const resp = await page.request.get("http://localhost:81/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const user = await resp.json();
    expect(user.username).toBe(creds.username);
    expect(user.email).toBe(creds.email);
  });

  test("5. Logout — clear token and verify redirect", async ({ page }) => {
    const token = await apiLogin(page, creds.username, currentPassword);
    await page.goto("/login");
    await page.evaluate((t) => localStorage.setItem("token", t), token);
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Clear token (simulates logout)
    await page.evaluate(() => localStorage.removeItem("token"));
    await page.goto("/");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("6. Login via UI with credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("Nazwa użytkownika lub email").fill(creds.username);
    await page.getByPlaceholder("Hasło").fill(currentPassword);
    await page.getByRole("button", { name: "Zaloguj" }).click();

    // Should redirect to dashboard or onboarding
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("7. Forgot password — sends reset email", async ({ page }) => {
    await page.goto("/odzyskaj-haslo");

    await page.getByPlaceholder(/email/i).fill(creds.email);
    await page.getByRole("button", { name: /wyślij|resetuj|zmień/i }).click();

    // Should show success message about checking email
    await expect(
      page.getByText(/wysłaliśmy|sprawdź.*email|link.*reset/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("8. Delete account via API and verify login fails", async ({ page }) => {
    const token = await apiLogin(page, creds.username, currentPassword);
    await apiDeleteAccount(page, token, currentPassword);

    // Try to login with deleted account
    await page.goto("/login");
    await page.getByPlaceholder("Nazwa użytkownika lub email").fill(creds.username);
    await page.getByPlaceholder("Hasło").fill(currentPassword);
    await page.getByRole("button", { name: "Zaloguj" }).click();

    // Should show error
    await page.waitForTimeout(2000);
    const hasError = await page
      .getByText(/nieprawidłow|błąd|nie znaleziono/i)
      .isVisible()
      .catch(() => false);
    expect(hasError).toBeTruthy();
  });
});
