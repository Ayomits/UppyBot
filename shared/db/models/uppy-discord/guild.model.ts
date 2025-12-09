import { buildSchema, prop } from "@typegoose/typegoose";

import type { LiteralEnum } from "#/shared/libs/djs/types.js";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

export const GuildType = {
  Common: 0,
  Premium: 1,
  Test: 2,
  Developer: 3,
} as const;

export type GuildType = LiteralEnum<typeof GuildType>;

export class Guild {
  @prop({ required: true, unique: true })
  guildId: string;

  @prop({ required: true })
  guildName: string;

  @prop({ default: null })
  guildAvatar: string;

  @prop({})
  type: number;

  @prop({ default: true })
  isActive: boolean;
}

export const GuildCollectionName = "guilds";

export const GuildSchema = buildSchema(Guild);

export const GuildModel = createLazyModel(() => mainMongoConnection, Guild, {
  existingConnection: mainMongoConnection!,
});
