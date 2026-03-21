const API_BASE = import.meta.env.VITE_API_URL || "/api";

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
  if (typeof data.detail === "object" && data.detail !== null && !Array.isArray(data.detail)) {
    return data.detail.message || JSON.stringify(data.detail);
  }
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((e) => e.msg || e.message || JSON.stringify(e))
      .join(", ");
  }
  return null;
}

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function isLimitError(data) {
  const detail = data?.detail;
  if (typeof detail === "object" && detail !== null) {
    return detail.error === "voice_limit_reached" || detail.error === "shopping_limit_reached";
  }
  return false;
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

  // Handle limit errors (403/429) before auth redirect
  if (res.status === 429 || res.status === 403) {
    const data = await res.json().catch(() => ({}));
    if (isLimitError(data)) {
      throw new ApiError(
        data.detail?.message || `Błąd ${res.status}`,
        res.status,
        data.detail,
      );
    }
    if (res.status === 403) {
      handleUnauthorized(path);
      throw new Error("Nieautoryzowany");
    }
    throw new ApiError(parseErrorDetail(data) || `Błąd ${res.status}`, res.status, data.detail);
  }

  if (res.status === 401) {
    handleUnauthorized(path);
    throw new Error("Nieautoryzowany");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(parseErrorDetail(data) || `Błąd ${res.status}`, res.status, data.detail);
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

  // Handle limit errors (429) before auth redirect
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    if (isLimitError(data)) {
      throw new ApiError(data.detail?.message || `Błąd ${res.status}`, res.status, data.detail);
    }
    throw new ApiError(parseErrorDetail(data) || `Błąd ${res.status}`, res.status, data.detail);
  }

  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(path);
    throw new Error("Nieautoryzowany");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(parseErrorDetail(data) || `Błąd ${res.status}`, res.status, data.detail);
  }

  return res.json();
}
