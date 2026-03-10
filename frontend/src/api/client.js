const API_BASE = "/api";

let redirecting = false;

function handleUnauthorized(path) {
  // Don't redirect for auth endpoints — they handle 401 themselves
  if (path.startsWith("/auth/")) return;
  // Prevent multiple simultaneous redirects
  if (redirecting) return;
  redirecting = true;
  localStorage.removeItem("token");
  // Use a small delay to let any in-flight requests complete
  // and prevent abrupt context loss on mobile
  setTimeout(() => {
    window.location.href = "/login";
  }, 100);
}

function parseErrorDetail(data) {
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((e) => e.msg || e.message || JSON.stringify(e))
      .join(", ");
  }
  return null;
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error("Sprawdź połączenie z internetem i spróbuj ponownie.");
  }

  if (res.status === 401) {
    handleUnauthorized(path);
    throw new Error("Nieautoryzowany");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(parseErrorDetail(data) || `Błąd ${res.status}`);
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

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error("Sprawdź połączenie z internetem i spróbuj ponownie.");
  }

  if (res.status === 401) {
    handleUnauthorized(path);
    throw new Error("Nieautoryzowany");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(parseErrorDetail(data) || `Błąd ${res.status}`);
  }

  return res.json();
}
