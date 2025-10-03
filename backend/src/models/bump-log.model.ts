import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class BumpLog {
  @Prop({ required: true, index: true, alias: 'guild_id' })
  guildId: string;

  @Prop({ required: true, index: true })
  type: number;

  @Prop({ required: true, index: true, alias: 'author_id' })
  executorId: string;

  @Prop({ required: true, unique: true })
  messageId: string;

  @Prop({ required: true, default: 0, min: 0 })
  points: number;
}

export const BumpLogCollectionName = 'bumps';

export const BumpLogSchema = SchemaFactory.createForClass(BumpLog);
