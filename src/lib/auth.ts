const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export interface LoginResponse {
  access_token: string;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error("Invalid credentials");
  }
  return res.json() as Promise<LoginResponse>;
}

export async function refresh(): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Session expired");
  }
  return res.json() as Promise<LoginResponse>;
}

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
