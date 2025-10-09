import { GuildType } from '#/enums/guild-type';
import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Guild {
  @Prop({ required: true, unique: true })
  @ApiProperty({ type: 'string' })
  guildId: string;

  @Prop({ required: true, default: GuildType.Common })
  @ApiProperty({ type: 'number' })
  type: number;

  @Prop({ required: true, default: true })
  @ApiProperty({ type: 'boolean' })
  isActive: boolean;
}
