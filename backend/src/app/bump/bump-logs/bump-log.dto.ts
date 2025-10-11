import { MonitoringType } from '#/enums/monitoring';
import { BumpLog } from '#/models/bump-log.model';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateBumpLogDto {
  @ApiProperty({
    enum: Object.values(MonitoringType),
    required: true,
  })
  @IsEnum(Object.values(MonitoringType))
  type: number;

  @ApiProperty({
    type: 'number',
    minimum: 0,
    required: true,
  })
  @IsPositive()
  points: number;

  @ApiProperty({
    type: 'string',
    required: true,
  })
  @IsString()
  messageId: string;
}

export class BumpLogFilter {
  @ApiProperty({
    name: 'type',
    description: 'По какому мониторингу сортировать',
    enum: Object.values(MonitoringType),
    required: false,
  })
  @IsEnum(Object.values(MonitoringType))
  @IsOptional()
  @Transform(({ value }) =>
    Object.values(MonitoringType).includes(parseInt(value, 10) as any)
      ? parseInt(value, 10)
      : false,
  )
  type?: number;

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
}

export class BumpLogPaginationResponse {
  @ApiProperty({ type: [BumpLog] })
  items: BumpLog[];

  @ApiProperty({ type: 'boolean' })
  hasNext: boolean;

  @ApiProperty({
    type: 'number',
  })
  maxPages: number;

  @ApiProperty({
    type: 'number',
  })
  count: number;
}
