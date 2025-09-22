import { type IsGuardUserCallback } from "@discordx/utilities";

export const GuildOnly: IsGuardUserCallback = ({ guild }) => {
  return !!guild;
};
