import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("petrosoft_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || "");
    const method = String(error.config?.method || "").toLowerCase();

    if (status === 401) {
      const onLoginPage = window.location.pathname.includes("/login");

      // Do NOT force logout for cash-closure close — let the page show the error
      const isCashClosureClose =
        method === "post" &&
        url.includes("/cash-closure") &&
        url.includes("/close");

      if (!onLoginPage && !isCashClosureClose) {
        localStorage.removeItem("petrosoft_token");
        localStorage.removeItem("petrosoft_user");
        window.location.href = "/login";
      } else if (isCashClosureClose) {
        // Keep user on page; closeDay() catch will handle setError
        console.warn(
          "Cash closure close unauthorized:",
          error.response?.data
        );
      }
    }

    return Promise.reject(error);
  }
);

export const apiGet = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url);
  return response.data;
};

export const apiPost = async <T, B = unknown>(
  url: string,
  body: B
): Promise<T> => {
  const response = await api.post<T>(url, body);
  return response.data;
};

export const apiPut = async <T, B = unknown>(
  url: string,
  body: B
): Promise<T> => {
  const response = await api.put<T>(url, body);
  return response.data;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T>(url);
  return response.data;
};

export const apiPatch = async <T, B = unknown>(
  url: string,
  body: B
): Promise<T> => {
  const response = await api.patch<T>(url, body);
  return response.data;
};