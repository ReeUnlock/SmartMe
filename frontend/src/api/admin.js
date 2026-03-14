const ADMIN_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/admin`
  : "/api/admin";

function getAdminKey() {
  return sessionStorage.getItem("admin_key");
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
    sessionStorage.removeItem("admin_key");
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
};
