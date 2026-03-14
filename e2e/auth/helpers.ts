/**
 * E2E auth test helpers for SmartMe (single-user app).
 *
 * IMPORTANT: This is a single-user app. Only ONE account can exist at a time.
 * Tests must setup → use → delete sequentially.
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

/** Create user via API (bypasses UI for speed) */
export async function apiSetup(
  page: Page,
  creds: { username: string; email: string; password: string }
): Promise<string> {
  const resp = await page.request.post(`${API}/auth/setup`, { data: creds });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  return body.access_token;
}

/** Login via API, return token */
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

/** Ensure clean state: delete any existing user if possible */
export async function ensureCleanState(page: Page): Promise<void> {
  const resp = await page.request.get(`${API}/auth/status`);
  const body = await resp.json();
  if (!body.setup_completed) return; // already clean
  // Cannot delete without auth — if there's an existing user we can't remove
  // Tests should handle this gracefully
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
