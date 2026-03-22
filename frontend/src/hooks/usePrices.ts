import { useQuery } from "@tanstack/react-query";
import { fetchPrices } from "@/lib/api";

const POLL_MS = Number(import.meta.env.VITE_PRICES_POLL_MS ?? 300_000);

export function usePrices() {
  return useQuery({
    queryKey: ["prices"],
    queryFn: fetchPrices,
    refetchInterval: POLL_MS,
    // Prices don't change that fast — keep previous data visible while refetching
    placeholderData: (prev) => prev,
    staleTime: POLL_MS / 2,
  });
}
