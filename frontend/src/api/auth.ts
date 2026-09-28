import api from "./client";

export interface User {
  id: string;
  name: string;
  email: string;
}

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

export async function getProfile() {
  const { data } = await api.get<User>("/auth/profile");
  return data;
}
