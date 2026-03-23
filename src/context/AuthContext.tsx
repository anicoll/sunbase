import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { login as apiLogin, logout as apiLogout, refresh } from "@/lib/auth";
import { createApiClient, type ApiClient } from "@/lib/api";

interface AuthContextValue {
  accessToken: string | null;
  isRestoring: boolean;
  client: ApiClient;
  login(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const didRestore = useRef(false);

  // Keep a ref so the client closure always reads the latest token without
  // needing to be recreated on every state change.
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = accessToken;

  // The client is created once for the lifetime of the provider.
  const client = useRef<ApiClient>(
    createApiClient(
      () => tokenRef.current,
      (newToken) => setAccessToken(newToken),
      () => setAccessToken(null) // clears token → ProtectedRoute redirects to /login
    )
  ).current;

  // On mount, attempt to restore the session from the httpOnly refresh cookie.
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;

    refresh()
      .then((res) => setAccessToken(res.access_token))
      .catch(() => {
        // No valid session — user needs to log in.
      })
      .finally(() => setIsRestoring(false));
  }, []);

  // Proactively refresh the access token every 10 minutes while logged in.
  useEffect(() => {
    if (!accessToken) return;
    const id = setInterval(() => {
      refresh()
        .then((res) => setAccessToken(res.access_token))
        .catch(() => setAccessToken(null));
    }, 1 * 60 * 1000);
    return () => clearInterval(id);
  }, [accessToken]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    setAccessToken(res.access_token);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ accessToken, isRestoring, client, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
