import axios from "@/api/http";

export async function login(username: string, password: string) {
  // nejprve preferuj /login
  try {
    const { data } = await axios.post("/login", { username, password });
    return data;
  } catch (e: any) {
    // fallback: /auth/login (kdyby FE/BE nebyly ve shodě)
    if (e?.response?.status === 404) {
      const { data } = await axios.post("/auth/login", { username, password });
      return data;
    }
    throw e;
  }
}
