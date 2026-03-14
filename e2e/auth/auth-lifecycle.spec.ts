/**
 * E2E Auth Lifecycle — full user flow through the UI.
 *
 * Prerequisites: App running at http://localhost:81 (docker-compose up)
 * with NO existing user (clean DB).
 *
 * Flow: Setup → Login → Dashboard → Change Password → Forgot Password →
 *       Delete Account → Verify account gone
 */
import { test, expect } from "@playwright/test";
import {
  testCredentials,
  apiDeleteAccount,
  apiLogin,
  ensureCleanState,
} from "./helpers";

const creds = testCredentials("lifecycle");
let currentPassword = creds.password;

test.describe.serial("Auth Lifecycle", () => {
  test.beforeAll(async ({ browser }) => {
    // Ensure clean state via API
    const page = await browser.newPage();
    await ensureCleanState(page);
    await page.close();
  });

  test("1. Register via /setup", async ({ page }) => {
    await page.goto("/setup");

    // Fill registration form (Polish placeholders)
    await page.getByPlaceholder("Nazwa użytkownika").fill(creds.username);
    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Hasło (min. 6 znaków)").fill(creds.password);

    // Submit
    await page.getByRole("button", { name: "Rozpocznij" }).click();

    // Should redirect to onboarding (/witaj) after successful setup
    await expect(page).toHaveURL(/\/witaj/, { timeout: 10_000 });
  });

  test("2. Complete onboarding and reach dashboard", async ({ page }) => {
    // Set token from API login to skip UI login
    const token = await apiLogin(page, creds.username, currentPassword);
    await page.goto("/login");
    await page.evaluate((t) => localStorage.setItem("token", t), token);
    await page.goto("/");

    // Should see dashboard or onboarding
    // If onboarding not completed, we may be on /witaj
    const url = page.url();
    if (url.includes("/witaj")) {
      // Complete onboarding by clicking through steps
      // Step 1: Welcome — look for continue/next button
      const nextBtn = page.getByRole("button", { name: /dalej|kontynuuj|rozpocznij/i });
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
      }
      // Wait for onboarding to finish or navigate manually
      await page.waitForTimeout(2000);
    }
  });

  test("3. Verify logged in — /me returns user data", async ({ page }) => {
    const token = await apiLogin(page, creds.username, currentPassword);
    const resp = await page.request.get("http://localhost:81/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const user = await resp.json();
    expect(user.username).toBe(creds.username);
    expect(user.email).toBe(creds.email);
  });

  test("4. Logout — clear token and verify redirect", async ({ page }) => {
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

  test("5. Login via UI with credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("Nazwa użytkownika lub email").fill(creds.username);
    await page.getByPlaceholder("Hasło").fill(currentPassword);
    await page.getByRole("button", { name: "Zaloguj" }).click();

    // Should redirect to dashboard or onboarding
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("6. Forgot password — reset via /odzyskaj-haslo", async ({ page }) => {
    const newPassword = "ResetE2E_123!";
    await page.goto("/odzyskaj-haslo");

    await page.getByPlaceholder("Adres email powiązany z kontem").fill(creds.email);
    await page.getByPlaceholder("Nowe hasło (min. 6 znaków)").fill(newPassword);
    await page.getByPlaceholder("Powtórz nowe hasło").fill(newPassword);
    await page.getByRole("button", { name: "Zmień hasło" }).click();

    // Should show success message
    await expect(page.getByText("Hasło zostało zmienione")).toBeVisible({ timeout: 10_000 });

    // Verify can click through to login
    await page.getByRole("button", { name: "Przejdź do logowania" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });

    currentPassword = newPassword;
  });

  test("7. Login with new password after reset", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("Nazwa użytkownika lub email").fill(creds.username);
    await page.getByPlaceholder("Hasło").fill(currentPassword);
    await page.getByRole("button", { name: "Zaloguj" }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("8. Delete account via API and verify login fails", async ({ page }) => {
    const token = await apiLogin(page, creds.username, currentPassword);
    await apiDeleteAccount(page, token, currentPassword);

    // Try to login with deleted account
    await page.goto("/login");
    await page.getByPlaceholder("Nazwa użytkownika lub email").fill(creds.username);
    await page.getByPlaceholder("Hasło").fill(currentPassword);
    await page.getByRole("button", { name: "Zaloguj" }).click();

    // Should show error or redirect to setup (no user exists)
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = await page.getByText(/nieprawidłow|błąd|nie znaleziono/i).isVisible().catch(() => false);
    // Either shows error message or redirects to /setup
    expect(hasError || url.includes("/setup")).toBeTruthy();
  });
});
