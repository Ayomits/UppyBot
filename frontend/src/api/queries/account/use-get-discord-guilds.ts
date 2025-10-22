import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/api";
import { ListResponse, QueryOptions } from "../../utils/types";

export type UserDiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  invited: boolean;
  inviteLink: string;
};

export async function getDiscordGuilds() {
  const res = await api.get<ListResponse<UserDiscordGuild>>(
    "/api/users/@me/guilds"
  );
  return await res.json();
}

export function useGetDiscordGuilds(
  options?: QueryOptions<ListResponse<UserDiscordGuild>>
) {
  return useQuery({
    queryKey: ["user_guilds"],
    queryFn: getDiscordGuilds,
    ...options,
  });
}
