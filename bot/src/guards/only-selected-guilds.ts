import { type IsGuardUserCallback } from "@discordx/utilities";

export const SelectedGuildsOnly: (guilds: string[]) => IsGuardUserCallback = (
  guilds: string[]
) => {
  return ({ guild }) => {
    return guilds.includes(guild?.id ?? "");
  };
};
