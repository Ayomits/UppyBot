import type { Document } from "mongoose";

export interface BaseGuildDocument extends Document {
  guildId: string;
}

export interface BaseModuleGuildDocument extends BaseGuildDocument {
  enable: boolean;
}

export interface UserDocument extends BaseGuildDocument {
  userId: string;
}
