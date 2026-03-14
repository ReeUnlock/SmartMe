/**
 * E2E auth test helpers for SmartMe (multi-user app with email verification).
 *
 * Uses /api/auth/test-verify-email (dev-only endpoint) to verify emails
 * since E2E tests cannot receive real emails.
 */
import { Page, expect } from "@playwright/test";

const API = "http://localhost:81/api";

/** Generate unique test credentials */
export function testCredentials(label = "e2e") {
  const uid = Math.random().toString(36).slice(2, 10);
  return {
    username: `${label}_${uid}`,
    email: `${label}_${uid}@example.com`,
    password: `E2ePass_${uid}!`,
  };
}

/** Register user via API (returns 201, user is unverified) */
export async function apiRegister(
  page: Page,
  creds: { username: string; email: string; password: string }
): Promise<void> {
  const resp = await page.request.post(`${API}/auth/register`, { data: creds });
  expect(resp.status()).toBe(201);
}

/** Verify user's email via dev-only test endpoint */
export async function apiVerifyEmail(
  page: Page,
  email: string
): Promise<void> {
  const resp = await page.request.post(`${API}/auth/test-verify-email`, {
    data: { email },
  });
  expect(resp.status()).toBe(200);
}

/**
 * Register + verify email + login via API. Returns JWT token.
 * Full setup helper for tests that need an authenticated user.
 */
export async function apiSetupAndLogin(
  page: Page,
  creds: { username: string; email: string; password: string }
): Promise<string> {
  await apiRegister(page, creds);
  await apiVerifyEmail(page, creds.email);
  return await apiLogin(page, creds.username, creds.password);
}

/** Reset backend rate limiters (dev-only, prevents cross-test 429s) */
export async function apiResetRateLimits(page: Page): Promise<void> {
  await page.request.post(`${API}/auth/test-reset-rate-limits`);
}

/** Login via API, return token (user must already be verified) */
export async function apiLogin(
  page: Page,
  username: string,
  password: string
): Promise<string> {
  const resp = await page.request.post(`${API}/auth/login`, {
    data: { username, password },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  return body.access_token;
}

/** Delete account via API (cleanup) */
export async function apiDeleteAccount(
  page: Page,
  token: string,
  password: string
): Promise<void> {
  const resp = await page.request.post(`${API}/auth/reset`, {
    data: { password },
    headers: { Authorization: `Bearer ${token}` },
  });
  // Accept 200 (success) or 401 (already deleted / invalid token)
  expect([200, 401]).toContain(resp.status());
}

/** Set token in localStorage and navigate to dashboard */
export async function loginViaStorage(
  page: Page,
  token: string
): Promise<void> {
  await page.goto("/login");
  await page.evaluate((t) => localStorage.setItem("token", t), token);
  await page.goto("/");
}
