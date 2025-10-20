import { useQuery } from "@tanstack/react-query";
import { QueryOptions } from "../utils/types";
import { api } from "../utils/api";

export interface PublicStats {
  commands: number;
  guilds: number;
}

export async function getPublicStats() {
  const res = await api.get<PublicStats>("/api/stats/all", {
    next: { revalidate: 3_600 },
  });
  return (await res.json()) as PublicStats;
}

export function getPublicStatsOptions(options?: QueryOptions<PublicStats>) {
  return {
    queryKey: ["public_stats"],
    queryFn: getPublicStats,
    ...options,
  };
}

export function useGetPublicStats(options?: QueryOptions<PublicStats>) {
  return useQuery(getPublicStatsOptions(options));
}
