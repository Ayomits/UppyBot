import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { api } from "../utils/api";

type DiscordLoginUrlResponse = { url: string };

export async function getDiscordLoginUrl(): Promise<DiscordLoginUrlResponse> {
  const response = await api.get<DiscordLoginUrlResponse>("/api/auth/signin");
  return response.data;
}

export function useGetDiscordLoginUrl(
  options?: Omit<
    UseQueryOptions<DiscordLoginUrlResponse, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: ["discord_url"],
    queryFn: getDiscordLoginUrl,
    ...options,
  });
}
