import { LiteralEnum } from '#/types/literal-enum';

export const GuildType = {
  Common: 0,
  Premium: 1,
  Test: 2,
  Developer: 3,
} as const;

export type GuildType = LiteralEnum<typeof GuildType>;
