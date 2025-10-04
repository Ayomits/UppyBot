import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class PointSettings {
  @Prop({ required: true, index: true })
  guildId: string;

  @Prop({ required: true })
  type: number;

  @Prop({ default: 0, required: true })
  default: number;

  // night time bonus
  @Prop({ default: 0, required: true })
  bonus: number;
}

export const PointSettingsCollectionName = 'point_settings';

export const PointSettingsSchema = SchemaFactory.createForClass(PointSettings);
