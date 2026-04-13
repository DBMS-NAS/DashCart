export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

export const VALID_ROLES = ["customer", "staff"];

export function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCurrentUser() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  if (!token || !VALID_ROLES.includes(role)) {
    return null;
  }

  return { token, username, role };
}

export function saveCurrentUser({ access, refresh, username, role }) {
  localStorage.setItem("token", access);
  localStorage.setItem("refreshToken", refresh);
  localStorage.setItem("username", username);
  localStorage.setItem("role", role);
}

export function clearCurrentUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
}

// Tries to refresh the access token using the stored refresh token.
// Returns true if successful, false if the session is fully expired.
export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem("token", data.access);
    return true;
  } catch {
    return false;
  }
}

// Use this instead of axios directly for authenticated requests.
// Automatically retries once after refreshing the token on 401.
export async function apiFetch(url, options = {}) {
  const makeRequest = () =>
    fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...options.headers,
      },
    });

  let res = await makeRequest();

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      clearCurrentUser();
      window.location.href = "/login";
      return;
    }
    res = await makeRequest();
  }

  return res;
}