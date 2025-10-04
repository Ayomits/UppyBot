import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class BumpLog {
  @ApiProperty({ type: 'string' })
  @Prop({ required: true, index: true, alias: 'guild_id', expires: '30d' })
  guildId: string;

  @ApiProperty({ type: 'number' })
  @Prop({ required: true, index: true })
  type: number;

  @ApiProperty({ type: 'string' })
  @Prop({ required: true, index: true, alias: 'author_id' })
  executorId: string;

  @ApiProperty({ type: 'string' })
  @Prop({ required: true, unique: true })
  messageId: string;

  @ApiProperty({ type: 'number' })
  @Prop({ required: true, default: 0, min: 0 })
  points: number;

  @Prop({ expires: '30d' })
  createdAt?: Date;
}

export const BumpLogCollectionName = 'bumps';

export const BumpLogSchema = SchemaFactory.createForClass(BumpLog);
