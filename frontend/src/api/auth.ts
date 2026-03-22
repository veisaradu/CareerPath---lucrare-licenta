import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export const login = async (
  credentials: LoginCredentials
): Promise<TokenResponse> => {
  const { data } = await API.post<TokenResponse>(
    "/users/token/",
    credentials
  );
  return data;
};

export const refreshToken = async (): Promise<string> => {
  const refresh = localStorage.getItem("refresh");
  const { data } = await API.post<{ access: string }>(
    "/users/token/refresh/",
    { refresh }
  );
  return data.access;
};

export const register = async (data: RegisterData): Promise<void> => {
  await API.post("/users/register/", data);
};

export default API;