import type { PriceInterval, PropertyReading } from "@/types/api";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

const PRICE_PAST_HOURS = Number(
  import.meta.env.VITE_PRICE_WINDOW_PAST_HOURS ?? 4
);
const PRICE_FUTURE_HOURS = Number(
  import.meta.env.VITE_PRICE_WINDOW_FUTURE_HOURS ?? 10
);

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status} ${res.statusText} — ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchProperties(): Promise<PropertyReading[]> {
  return get<PropertyReading[]>("/properties");
}

export async function fetchPrices(): Promise<PriceInterval[]> {
  const now = Date.now();
  const start = new Date(now - PRICE_PAST_HOURS * 3_600_000).toISOString();
  const end = new Date(now + PRICE_FUTURE_HOURS * 3_600_000).toISOString();
  return get<PriceInterval[]>(`/amber/prices/${start}/${end}`);
}
