import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class BumpUser {
  @Prop({ required: true })
  @ApiProperty({ type: 'string' })
  guildId: string;

  @Prop({ required: true })
  @ApiProperty({ type: 'string' })
  userId: string;

  @Prop({ required: true, default: Date.now() })
  @ApiProperty({ type: Date })
  timestamp: Date;

  @Prop({ required: true, default: 0 })
  @ApiProperty({ type: 'number' })
  points: number;

  @Prop({ required: true, default: 0 })
  @ApiProperty({ type: 'number' })
  dsMonitoring: number;

  @Prop({ required: true, default: 0 })
  @ApiProperty({ type: 'number' })
  sdcMonitoring: number;

  @Prop({ required: true, default: 0 })
  @ApiProperty({ type: 'number' })
  serverMonitoring: number;

  @Prop({ required: true, default: 0 })
  @ApiProperty({ type: 'number' })
  disboardMonitoring: number;
}

export const BumpUserCollectionName = 'bump_users';

export const BumpUserSchema = SchemaFactory.createForClass(BumpUser);
