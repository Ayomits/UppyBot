import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class BumpLog {
  @ApiProperty({ example: '123456789', description: 'ID гильдии' })
  @Prop({ required: true, index: true, alias: 'guild_id' })
  guildId: string;

  @ApiProperty({ example: 1, description: 'Тип бампа' })
  @Prop({ required: true, index: true })
  type: number;

  @ApiProperty({ example: '987654321', description: 'ID исполнителя' })
  @Prop({ required: true, index: true, alias: 'author_id' })
  executorId: string;

  @ApiProperty({ example: '112233445566778899', description: 'ID сообщения' })
  @Prop({ required: true, unique: true })
  messageId: string;

  @ApiProperty({ example: 10, description: 'Начисленные очки' })
  @Prop({ required: true, default: 0, min: 0 })
  points: number;
}

export const BumpLogCollectionName = 'bumps';

export const BumpLogSchema = SchemaFactory.createForClass(BumpLog);
