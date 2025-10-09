import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class UppySettings {
  @Prop({ required: true, index: true, unique: true })
  @ApiProperty({ type: 'string' })
  guildId: string;

  @Prop({ default: [] })
  @ApiProperty({ type: [String] })
  bumpRoleIds?: string[];

  @Prop({ default: [] })
  @ApiProperty({ type: [String] })
  managerRoles: string[];

  @Prop({ default: null })
  @ApiProperty({ type: 'string' })
  bumpBanRoleId?: string;

  @Prop({ default: null })
  @ApiProperty({ type: 'string' })
  pingChannelId?: string;

  @Prop({ default: null })
  @ApiProperty({ type: 'string' })
  actionLogChannelId?: string;

  @Prop({ default: false })
  @ApiProperty({ type: 'boolean' })
  useForceOnly: boolean;

  @Prop({ min: 0, default: 0 })
  @ApiProperty({ type: 'number' })
  force: number;
}

export const UppySettingsCollectionName = 'helper_bot_settings';
export const UppySettingsSchema = SchemaFactory.createForClass(UppySettings);
