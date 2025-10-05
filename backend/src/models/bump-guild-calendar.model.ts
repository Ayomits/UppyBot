import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class BumpGuildCalendar {
  @Prop({ required: true, index: true })
  guildId: string;

  @Prop({ required: true })
  formatted: string;

  @Prop({ required: true, default: Date.now(), expires: '30d' })
  timestamp: Date;
}

export const BumpGuildCalendarCollectionName = 'bump_guild_calendar';

export const BumpGuildCalendarSchema =
  SchemaFactory.createForClass(BumpGuildCalendar);
