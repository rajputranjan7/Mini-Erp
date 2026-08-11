import axios from "axios";

// Configure VITE_API_URL in .env for the frontend to point at the deployed backend.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("erp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, the API returns 401 - bounce to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("erp_token");
      localStorage.removeItem("erp_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; details?: unknown } | undefined;
    if (data?.error) return data.error;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
