export const VALID_ROLES = ["customer", "staff"];

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
