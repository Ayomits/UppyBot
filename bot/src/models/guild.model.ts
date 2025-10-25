import { buildSchema, getModelForClass, prop } from "@typegoose/typegoose";

export class Guild {
  @prop({ required: true })
  guildId: string;

  @prop({})
  type: number;

  @prop({ default: true })
  isActive: boolean;
}

export const GuildCollectionName = "guilds";

export const GuildSchema = buildSchema(Guild);

export const GuildModel = getModelForClass(Guild);
