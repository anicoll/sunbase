import type { PriceInterval, PropertyReading } from "@/types/api";
import { refresh } from "@/lib/auth";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

const PRICE_PAST_HOURS = Number(
  import.meta.env.VITE_PRICE_WINDOW_PAST_HOURS ?? 4
);
const PRICE_FUTURE_HOURS = Number(
  import.meta.env.VITE_PRICE_WINDOW_FUTURE_HOURS ?? 10
);

export interface ApiClient {
  fetchProperties(): Promise<PropertyReading[]>;
  fetchPrices(): Promise<PriceInterval[]>;
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

    fetchPrices(): Promise<PriceInterval[]> {
      const now = Date.now();
      const start = new Date(now - PRICE_PAST_HOURS * 3_600_000).toISOString();
      const end = new Date(now + PRICE_FUTURE_HOURS * 3_600_000).toISOString();
      return request<PriceInterval[]>(`/amber/prices/${start}/${end}`);
    },

    allowFeedIn(): Promise<void> {
      return request<void>("/inverter/feedin", false, {
        method: "POST",
        body: JSON.stringify({ disable: false }),
      }, true);
    },
  };
}
