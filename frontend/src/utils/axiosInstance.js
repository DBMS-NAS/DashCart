import axios from "axios";
import { API_BASE_URL, authHeaders, refreshAccessToken, clearCurrentUser } from "./api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token to every request
axiosInstance.interceptors.request.use((config) => {
  const headers = authHeaders();
  if (headers.Authorization) {
    config.headers.Authorization = headers.Authorization;
  }
  return config;
});

// On 401, try refreshing once then retry
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshed = await refreshAccessToken();

      if (!refreshed) {
        clearCurrentUser();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      const headers = authHeaders();
      originalRequest.headers.Authorization = headers.Authorization;
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;