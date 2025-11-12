import type { DocumentType } from "@typegoose/typegoose";
import { getModelForClass, prop } from "@typegoose/typegoose";

export class Premium {
  @prop({ required: true, unique: true })
  guildId: string;

  @prop({})
  expiresAt: Date;
}

export const PremiumModel = getModelForClass(Premium, {
  options: {
    customName: "premium_subscriptions",
  },
});

export type PremiumDocument = DocumentType<Premium>;
