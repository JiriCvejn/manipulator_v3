import { defineStore } from "pinia";
import axios from "@/api/http";
import { TOKEN_KEY } from "@/api/http";

interface User {
  id: string;
  username: string;
  role: "admin" | "operator" | "worker";
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: localStorage.getItem(TOKEN_KEY),
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (s) => !!s.token,
    role: (s) => s.user?.role ?? null,
  },

  actions: {
    async login(username: string, password: string) {
      this.loading = true; this.error = null;
      try {
        const { data } = await axios.post("/login", { username, password });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem(TOKEN_KEY, data.token);
        return true;
      } catch (e: any) {
        this.error = e?.response?.data?.error?.message || e?.message || "Login failed";
        this.token = null;
        this.user = null;
        localStorage.removeItem(TOKEN_KEY);
        return false;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
});
