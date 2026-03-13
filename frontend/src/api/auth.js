import { apiFetch } from "./client";

export function checkAuthStatus() {
  return apiFetch("/auth/status");
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

export function forgotPassword(email, newPassword) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, new_password: newPassword }),
  });
}
