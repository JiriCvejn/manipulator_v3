import axiosBase from "axios";

export const TOKEN_KEY = "authToken";

const axios = axiosBase.create({
  baseURL: "http://localhost:3000",
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Volitelná diagnostika – ať hned vidíš, co se děje
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    // eslint-disable-next-line no-console
    console.error("[API ERROR]", {
      url: err.config?.url,
      method: err.config?.method,
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });
    return Promise.reject(err);
  }
);

export default axios;

