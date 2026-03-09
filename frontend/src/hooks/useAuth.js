import { create } from "zustand";
import { getMe } from "../api/auth";

export const useAuth = create((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isLoading: true,

  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    set({ token });
  },

  setUser: (user) => set({ user }),

  loadUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isLoading: false, user: null });
      return;
    }
    try {
      const user = await getMe();
      set({ user, isLoading: false });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null, isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
    window.location.href = "/login";
  },
}));
