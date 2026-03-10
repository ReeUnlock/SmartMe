import { create } from "zustand";
import { getMe } from "../api/auth";

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
}

function clearAuthStorage() {
  localStorage.removeItem("token");
}

export const useAuth = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token"),
  isLoading: true,

  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      clearAuthStorage();
    }
    set({ token });
  },

  setUser: (user) => set({ user }),

  loadUser: async () => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      clearAuthStorage();
      set({ isLoading: false, user: null, token: null });
      return;
    }
    try {
      const user = await Promise.race([
        getMe(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000)
        ),
      ]);
      set({ user, isLoading: false });
    } catch {
      clearAuthStorage();
      set({ user: null, token: null, isLoading: false });
    }
  },

  needsOnboarding: () => {
    const { user } = get();
    return user && !user.onboarding_completed;
  },

  logout: () => {
    clearAuthStorage();
    set({ user: null, token: null });
    window.location.href = "/login";
  },
}));
