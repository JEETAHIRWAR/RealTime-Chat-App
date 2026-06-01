import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) =>
{
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,

  async (err) =>
  {
    const originalRequest = err.config;

    if (
      err?.response?.status === 401 &&
      !originalRequest?._retry
    )
    {
      originalRequest._retry = true;

      try
      {
        const refreshToken =
          useAuthStore.getState().refreshToken ||
          localStorage.getItem("refresh_token");

        if (!refreshToken)
        {
          throw new Error("Refresh token missing");
        }

        const res = await axios.post(
          `${baseURL}/api/auth/refresh-token`,
          {
            refreshToken,
          }
        );

        const newAccessToken =
          res?.data?.accessToken;

        if (!newAccessToken)
        {
          throw new Error("New access token missing");
        }

        useAuthStore.getState().setAuth({
          token: newAccessToken,
          user: useAuthStore.getState().user,
          refreshToken,
        });

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      }
      catch (refreshError)
      {
        useAuthStore.getState().logout();

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login")
        )
        {
          window.location.assign("/login");
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);
