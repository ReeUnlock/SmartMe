const ADMIN_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/admin`
  : "/api/admin";

export function getAdminKey() {
  const session = sessionStorage.getItem("admin_key");
  if (session) return session;

  const stored = localStorage.getItem("admin_key");
  const expires = localStorage.getItem("admin_key_expires");
  if (stored && expires && Date.now() < parseInt(expires)) return stored;

  localStorage.removeItem("admin_key");
  localStorage.removeItem("admin_key_expires");
  return null;
}

export function clearAdminKey() {
  sessionStorage.removeItem("admin_key");
  localStorage.removeItem("admin_key");
  localStorage.removeItem("admin_key_expires");
}

async function adminFetch(path, options = {}) {
  const key = getAdminKey();
  const res = await fetch(`${ADMIN_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": key || "",
      ...options.headers,
    },
  });
  if (res.status === 403) {
    clearAdminKey();
    window.location.href = "/admin";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const adminApi = {
  health: () => adminFetch("/health"),
  stats: () => adminFetch("/stats"),
  users: (params) => adminFetch(`/users?${new URLSearchParams(params)}`),
  user: (id) => adminFetch(`/users/${id}`),
  feedback: (params) => adminFetch(`/feedback?${new URLSearchParams(params)}`),
  deleteUser: (id) => adminFetch(`/users/${id}`, { method: "DELETE" }),
};
