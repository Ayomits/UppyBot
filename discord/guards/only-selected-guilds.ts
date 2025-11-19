import { type IsGuardUserCallback } from "@discordx/utilities";

export const SelectedGuildsOnly: (guilds: string[]) => IsGuardUserCallback = (
  guilds: string[]
) => {
  return ({ guild }) => {
    console.log(guild!.id, guilds.includes(guild!.id));
    return guilds.includes(guild?.id ?? "");
  };
};
