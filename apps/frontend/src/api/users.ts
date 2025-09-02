import axios from "@/api/http";

export interface UserVm {
  id: number;
  username: string;
  role: "admin" | "operator" | "worker";
  active: boolean;
  homeStorageId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserQuery {
  search?: string;
  active?: boolean;
}

export interface UserUpdateDto {
  username?: string;
  role?: "admin" | "operator" | "worker";
  active?: boolean;
  password?: string;
  homeStorageId?: number | null;
}

export interface UserUpdateDto {
  username?: string;
  role?: "admin" | "operator" | "worker";
  active?: boolean;
  password?: string;
}

export async function fetchUsers(params: UserQuery = {}): Promise<UserVm[]> {
  const { data } = await axios.get("/users", { params });
  return data;
}

export async function createUser(payload: UserCreateDto): Promise<UserVm> {
  const { data } = await axios.post("/users", payload);
  return data;
}

export async function updateUser(id: number, payload: UserUpdateDto): Promise<UserVm> {
  const { data } = await axios.patch(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await axios.delete(`/users/${id}`);
}

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