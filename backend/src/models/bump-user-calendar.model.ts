import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  autoIndex: true,
})
export class BumpUserCalendar {
  @Prop({ required: true })
  guildId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  formatted: string;

  @Prop({ required: true, default: Date.now(), expires: '30d' })
  timestamp: Date;
}

export const BumpUserCalendarSchema =
  SchemaFactory.createForClass(BumpUserCalendar);

export const BumpUserCalendarCollectionName = 'bump_user_calendar';
