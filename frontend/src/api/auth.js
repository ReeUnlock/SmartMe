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

export function resetAccount() {
  return apiFetch("/auth/reset", { method: "DELETE" });
}
