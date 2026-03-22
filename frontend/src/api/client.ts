const BASE_URL = "http://127.0.0.1:8000/api";

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("access");
  
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access");
      window.location.href = "/login";
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Eroare la comunicarea cu serverul");
  }

  if (response.status === 204) {
    return {} as T; 
  }

  return response.json();
}