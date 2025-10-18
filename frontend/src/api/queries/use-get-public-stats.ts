import { useQuery } from "@tanstack/react-query";
import { QueryOptions } from "../utils/types";
import { api } from "../utils/api";

export interface PublicStats {
  commands: number;
  guilds: number;
}

export async function getPublicStats() {
  return await api.get<PublicStats>("/api/stats/all");
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
