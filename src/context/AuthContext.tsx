import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { login as apiLogin, logout as apiLogout, refresh } from "@/lib/auth";

interface AuthContextValue {
  accessToken: string | null;
  isRestoring: boolean;
  login(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const didRestore = useRef(false);

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

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    setAccessToken(res.access_token);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, isRestoring, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
