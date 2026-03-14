import { apiFetch } from "./client";

export function register(data) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function setup(data) {
  return apiFetch("/auth/setup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMe() {
  return apiFetch("/auth/me");
}

export function verifyEmail(token) {
  return apiFetch("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email) {
  return apiFetch("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function forgotPassword(email) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token, newPassword) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export function changePassword(currentPassword, newPassword) {
  return apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export function completeOnboarding() {
  return apiFetch("/auth/complete-onboarding", { method: "POST" });
}

export function resetAccount(password) {
  return apiFetch("/auth/reset", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function checkAuthStatus() {
  return apiFetch("/auth/status");
}
