// src/utils/apiClient.ts

import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_ENV === "development"
    ? process.env.NEXT_PUBLIC_API_URL_TEST
    : process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
  (config) => {

    const excludedRoutes = [
      "/task/auth/login",
      "/task/auth/register",
    ];

    const isExcludedRoute =
      excludedRoutes.some((route) =>
        config.url?.includes(route)
      );

    if (
      !isExcludedRoute &&
      typeof window !== "undefined"
    ) {

      const token =
        localStorage.getItem(
          "taskflow_token"
        );

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(

  (response) => response,

  (error) => {

    if (
      error?.response?.status === 401
    ) {

      localStorage.removeItem(
        "taskflow_token"
      );

      window.location.href =
        "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;