import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class BumpBan {
  @Prop({ required: true })
  @ApiProperty({ type: 'string' })
  guildId: string;

  @Prop({ required: true })
  @ApiProperty({ type: 'number' })
  type: number;

  @Prop({ required: true })
  @ApiProperty({ type: 'string' })
  userId: string;

  @Prop({ required: true, default: 0, min: 0 })
  @ApiProperty({ type: 'number' })
  removeIn: number;
}

export const BumpBanCollectionName = 'bump_bans';

export const BumpBanSchema = SchemaFactory.createForClass(BumpBan);
