import type { PropertyReading } from "@/types/api";
import { refresh } from "@/lib/auth";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export interface ApiClient {
  fetchProperties(): Promise<PropertyReading[]>;
  allowFeedIn(): Promise<void>;
}

/**
 * Creates an API client that attaches the current access token to every
 * request and handles 401 responses with a single refresh-and-retry attempt.
 *
 * @param getToken  Called at request time to read the latest access token.
 * @param onTokenRefreshed  Called with the new token after a successful refresh.
 * @param onUnauthorized  Called when a 401 cannot be recovered (refresh failed).
 */
export function createApiClient(
  getToken: () => string | null,
  onTokenRefreshed: (token: string) => void,
  onUnauthorized: () => void
): ApiClient {
  async function request<T>(
    path: string,
    retrying = false,
    init?: RequestInit,
    noBody = false
  ): Promise<T> {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
      ...init,
    });

    if (res.status === 401 && !retrying) {
      // Attempt a single token refresh then retry the original request.
      try {
        const refreshed = await refresh();
        onTokenRefreshed(refreshed.access_token);
        return request<T>(path, true, init, noBody);
      } catch {
        onUnauthorized();
        throw new Error("Session expired");
      }
    }

    if (!res.ok) {
      throw new Error(`API error ${res.status} ${res.statusText} — ${path}`);
    }

    if (noBody) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    fetchProperties(): Promise<PropertyReading[]> {
      return request<PropertyReading[]>("/properties");
    },

    allowFeedIn(): Promise<void> {
      return request<void>("/inverter/feedin", false, {
        method: "POST",
        body: JSON.stringify({ disable: false }),
      }, true);
    },
  };
}
