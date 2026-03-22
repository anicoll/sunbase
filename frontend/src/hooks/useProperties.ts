import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "@/lib/api";

const POLL_MS = Number(import.meta.env.VITE_PROPERTIES_POLL_MS ?? 10_000);

export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
    refetchInterval: POLL_MS,
    // Keep showing previous data while a background refetch is in-flight
    placeholderData: (prev) => prev,
  });
}
