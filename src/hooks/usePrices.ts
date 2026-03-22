import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

const POLL_MS = Number(import.meta.env.VITE_PRICES_POLL_MS ?? 300_000);

export function usePrices() {
  const { client } = useAuth();
  return useQuery({
    queryKey: ["prices"],
    queryFn: () => client.fetchPrices(),
    refetchInterval: POLL_MS,
    // Prices don't change that fast — keep previous data visible while refetching
    placeholderData: (prev) => prev,
    staleTime: POLL_MS / 2,
  });
}
