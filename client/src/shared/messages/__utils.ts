import type { Snowflake } from "discord.js";
import { blockQuote, channelMention, roleMention } from "discord.js";

import { TextFormattingUtility } from "#/libs/embed/text.utility.js";

export const getToggledValue = (value: boolean) => {
  return value ? "вкл" : "выкл";
};

export const createChannelField = (
  name: string,
  channelId: Snowflake | null,
) => ({
  name: blockQuote(name),
  value: TextFormattingUtility.snowflakeMention(
    channelId ? channelMention(channelId) : null,
  ),
  inline: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createPropertyField = (name: string, property: any) => ({
  name: blockQuote(name),
  value: typeof property === "string" ? property : String(property),
  inline: true,
});

export const createRoleField = (
  name: string,
  roleIds: Snowflake | Snowflake[] | null,
) => ({
  name: blockQuote(name),
  value: TextFormattingUtility.snowflakeMention(
    Array.isArray(roleIds)
      ? roleIds.map(roleMention)
      : roleIds
        ? roleMention(roleIds)
        : null,
  ),
  inline: !Array.isArray(roleIds),
});
