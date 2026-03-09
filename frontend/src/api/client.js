const API_BASE = "/api";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Don't redirect for /auth/me — useAuth.loadUser handles that gracefully
    if (!path.includes("/auth/me")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error("Nieautoryzowany");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    let message = `Błąd ${res.status}`;
    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      message = data.detail.map((e) => e.msg || e.message || JSON.stringify(e)).join(", ");
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function apiUpload(path, formData) {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Nieautoryzowany");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    let message = `Błąd ${res.status}`;
    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      message = data.detail.map((e) => e.msg || e.message || JSON.stringify(e)).join(", ");
    }
    throw new Error(message);
  }

  return res.json();
}
