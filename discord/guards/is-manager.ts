import { type IsGuardUserCallback } from "@discordx/utilities";

import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";

export const IsManager: IsGuardUserCallback = async ({ guild, user }) => {
  const member = await guild?.members.fetch(user?.id ?? "")?.catch(() => null);

  if (member?.permissions.has("Administrator")) {
    return true;
  }

  const settingsRepository = SettingsRepository.create();
  const settings = await settingsRepository.findGuildSettings(guild!.id);

  if (
    !settings.roles.managerRoles ||
    settings.roles.managerRoles?.length === 0
  ) {
    return false;
  }

  if (!member) {
    return false;
  }

  return member.roles.cache.some((r) =>
    settings.roles.managerRoles.includes(r.id)
  );
};
