import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';
import { DateTime } from 'luxon';

export class BumpUserCalendarFilter {
  @ApiProperty({
    name: 'offset',
    description: 'Страница. НАЧАЛО С 0',
    example: 0,
    required: true,
  })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  offset: number;

  @ApiProperty({
    name: 'limit',
    description: 'Количество записей',
    maximum: 50,
    minimum: 10,
    example: 10,
    required: true,
  })
  @IsInt()
  @Min(10)
  @Max(50)
  @Transform(({ value }) => parseInt(value, 10) ?? 10)
  limit: number;

  @ApiProperty({
    type: Date,
    example: DateTime.now().minus({ days: 770 }).toJSDate(),
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @ApiProperty({ type: Date, example: DateTime.now().toJSDate() })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  to: Date;
}
