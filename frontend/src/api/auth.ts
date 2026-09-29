import api from "./client";
import type { User } from "@/types/auth";

interface LoginResponse {
  accessToken: string;
}

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });

  return data;
}

export async function registerRequest(name: string, email: string, password: string) {
  const { data } = await api.post<User>("/auth/register", {
    name,
    email,
    password,
  });

  return data;
}

export async function getProfile() {
  const { data } = await api.get<User>("/auth/profile");
  return data;
}
