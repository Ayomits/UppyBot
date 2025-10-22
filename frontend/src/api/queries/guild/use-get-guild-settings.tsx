import { api } from "#/api/utils/api";
import { QueryOptions } from "#/api/utils/types";
import { useQuery } from "@tanstack/react-query";

export const guildSettingsQK = (guildId: string) => ["guild_settings", guildId];

type GeneralSettingsResponse = {
  guildId: string;
  bumpRoleIds: string[];
  managerRoles: string;
  bumpBanRoleId: string;
  pingChannelId: string;
  actionLogChannelId: string;
  useForceOnly: boolean;
  force: number;
};

export async function getGeneralSettings(guildId: string) {
  const res = await api.get(`/api/guild-settings/${guildId}`);
  return (await res.json()) as GeneralSettingsResponse;
}

export function useGetGeneralSettings(
  guildId: string,
  options?: QueryOptions<GeneralSettingsResponse>
) {
  return useQuery({
    queryKey: guildSettingsQK(guildId),
    queryFn: () => getGeneralSettings(guildId),
    ...options,
  });
}
