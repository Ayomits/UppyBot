import { IsGuildUser } from "@discordx/utilities";

import { developers } from "../const/owners.js";

export const IsDeveloper = IsGuildUser(async ({ user }) => {
  return developers.includes(user?.id ?? "");
});
